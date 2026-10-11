"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const CHANNEL_NAME = "smkn24:public-data-changed";

export default function PublicDataRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === CHANNEL_NAME) refresh();
    };

    window.addEventListener(CHANNEL_NAME, refresh);
    window.addEventListener("storage", onStorage);

    const channel = typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel(CHANNEL_NAME)
      : null;
    if (channel) channel.onmessage = refresh;

    return () => {
      window.removeEventListener(CHANNEL_NAME, refresh);
      window.removeEventListener("storage", onStorage);
      channel?.close();
    };
  }, [router]);

  return null;
}
