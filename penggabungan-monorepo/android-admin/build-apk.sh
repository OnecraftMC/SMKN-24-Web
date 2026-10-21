#!/usr/bin/env bash
#
# Build APK SMKN 24 Admin tanpa Gradle (aapt2 + javac + d8 + apksigner).
#
# Prasyarat:
#   - JDK 17           : JAVA_HOME atau ~/.local/android-build/jdk
#   - Android SDK      : ANDROID_SDK_ROOT atau ~/.local/android-build/sdk
#     dengan platforms;android-35 dan build-tools;35.0.0
#
# Output:
#   ~/.cache/smkn24-admin-build/SMKN24-Admin-<versi>.apk
#   ~/Downloads/SMKN24-Admin-<versi>.apk  (artefak untuk pengguna)
#
# Artefak APK sengaja TIDAK ditulis di dalam repository.
#
# Kunci penandatangan dibuat sekali di luar repository:
#   ~/.local/share/smkn24-admin/smkn24-admin.jks
#   ~/.local/share/smkn24-admin/smkn24-admin.jks.pass
# BACKUP kedua berkas itu: tanpa kunci yang sama, pembaruan APK tidak bisa
# dipasang menimpa versi lama.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_CODE="${VERSION_CODE:-2}"
VERSION_NAME="${VERSION_NAME:-1.1}"

SDK="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/.local/android-build/sdk}}"
JDK="${JAVA_HOME:-$HOME/.local/android-build/jdk}"
BUILD_TOOLS="$SDK/build-tools/35.0.0"
PLATFORM="$SDK/platforms/android-35/android.jar"

if [ ! -x "$JDK/bin/javac" ]; then
  echo "JDK tidak ditemukan di $JDK. Set JAVA_HOME." >&2
  exit 1
fi
if [ ! -f "$PLATFORM" ] || [ ! -x "$BUILD_TOOLS/aapt2" ]; then
  echo "Android SDK 35 tidak lengkap di $SDK." >&2
  echo "Set ANDROID_SDK_ROOT atau pasang platforms;android-35 + build-tools;35.0.0." >&2
  exit 1
fi

export JAVA_HOME="$JDK"
export PATH="$JDK/bin:$BUILD_TOOLS:$SDK/platform-tools:$PATH"

OUT="${SMKN24_BUILD_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/smkn24-admin-build}"
rm -rf "$OUT"
mkdir -p "$OUT/compiled" "$OUT/gen" "$OUT/classes" "$OUT/dex"

echo "==> 1/7 compile resource"
"$BUILD_TOOLS/aapt2" compile --dir "$ROOT/res" -o "$OUT/compiled/res.zip"

echo "==> 2/7 link resource + manifest"
"$BUILD_TOOLS/aapt2" link \
  -o "$OUT/base.apk" \
  -I "$PLATFORM" \
  --manifest "$ROOT/AndroidManifest.xml" \
  --java "$OUT/gen" \
  --min-sdk-version 24 \
  --target-sdk-version 35 \
  --version-code "$VERSION_CODE" \
  --version-name "$VERSION_NAME" \
  --auto-add-overlay \
  -R "$OUT/compiled/res.zip"

echo "==> 3/7 compile Java"
find "$ROOT/src" "$OUT/gen" -name '*.java' > "$OUT/sources.txt"
javac -encoding UTF-8 -source 8 -target 8 -Xlint:-options \
  -bootclasspath "$PLATFORM" -classpath "$PLATFORM" \
  -d "$OUT/classes" @"$OUT/sources.txt"

echo "==> 4/7 dex"
jar cf "$OUT/classes.jar" -C "$OUT/classes" .
"$BUILD_TOOLS/d8" --release --min-api 24 --lib "$PLATFORM" \
  --output "$OUT/dex" "$OUT/classes.jar"

echo "==> 5/7 susun APK"
cp "$OUT/base.apk" "$OUT/unsigned.apk"
(cd "$OUT/dex" && zip -q -j "$OUT/unsigned.apk" classes.dex)
"$BUILD_TOOLS/zipalign" -f 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"

echo "==> 6/7 siapkan kunci penandatangan"
KEYSTORE="${SMKN24_KEYSTORE:-$HOME/.local/share/smkn24-admin/smkn24-admin.jks}"
PASSFILE="$KEYSTORE.pass"
mkdir -p "$(dirname "$KEYSTORE")"
chmod 700 "$(dirname "$KEYSTORE")"
if [ ! -f "$KEYSTORE" ]; then
  if [ ! -f "$PASSFILE" ]; then
    umask 077
    (head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24) > "$PASSFILE"
    echo >> "$PASSFILE"
  fi
  STOREPASS="$(cat "$PASSFILE")"
  keytool -genkeypair -noprompt \
    -keystore "$KEYSTORE" -storetype PKCS12 \
    -alias smkn24admin -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$STOREPASS" -keypass "$STOREPASS" \
    -dname "CN=SMKN 24 Admin, O=SMKN 24 Jakarta, OU=IT, C=ID"
else
  STOREPASS="${SMKN24_STOREPASS:-$(cat "$PASSFILE" 2>/dev/null || true)}"
fi
if [ -z "${STOREPASS:-}" ]; then
  echo "Password keystore tidak ditemukan. Set SMKN24_STOREPASS." >&2
  exit 1
fi
chmod 600 "$KEYSTORE" "$PASSFILE" 2>/dev/null || true

APK="$OUT/SMKN24-Admin-$VERSION_NAME.apk"
"$BUILD_TOOLS/apksigner" sign \
  --ks "$KEYSTORE" --ks-key-alias smkn24admin \
  --ks-pass "pass:$STOREPASS" --key-pass "pass:$STOREPASS" \
  --out "$APK" "$OUT/aligned.apk"
"$BUILD_TOOLS/apksigner" verify --print-certs "$APK"

echo "==> 7/7 salin ke Downloads"
DEST="$HOME/Downloads/SMKN24-Admin-$VERSION_NAME.apk"
cp "$APK" "$DEST"
(cd "$(dirname "$DEST")" && sha256sum "$(basename "$DEST")") | tee "$DEST.sha256"
echo
echo "APK siap: $DEST"
echo "Ukuran : $(du -h "$DEST" | cut -f1)"
