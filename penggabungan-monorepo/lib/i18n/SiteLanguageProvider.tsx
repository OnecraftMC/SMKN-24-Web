"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { translatePhrase, type SiteLanguage } from "./translations";

type LanguageContextValue = {
  language: SiteLanguage;
  setLanguage: (language: SiteLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "smkn24-language";
const TRANSLATABLE_ATTRIBUTES = ["aria-label", "alt", "placeholder", "title"] as const;

type TranslationRecord = { source: string; translated: string };

export function SiteLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SiteLanguage>("id");
  const textRecords = useRef(new WeakMap<Node, TranslationRecord>());
  const elementRecords = useRef(new WeakMap<Element, Map<string, TranslationRecord>>());

  useEffect(() => {
    try {
      const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
      if (savedLanguage === "en" || savedLanguage === "id") setLanguageState(savedLanguage);
    } catch {
      // Storage can be unavailable in private or restricted browsing contexts.
    }
  }, []);

  const setLanguage = useCallback((nextLanguage: SiteLanguage) => {
    setLanguageState(nextLanguage);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch {
      // The language still changes for this session when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    const records = textRecords.current;
    const attributesByElement = elementRecords.current;
    const translateText = (node: Node) => {
      const current = node.nodeValue ?? "";
      if (!current.trim()) return;
      const previous = records.get(node);
      const source = previous && current === previous.translated ? previous.source : current;
      const translated = translatePhrase(source, language);
      records.set(node, { source, translated });
      if (translated !== current) node.nodeValue = translated;
    };
    const elementRecords = new WeakMap<Element, Map<string, TranslationRecord>>();

    const translateSubtree = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        translateText(root);
        return;
      }
      if (root.nodeType === Node.ELEMENT_NODE) {
        const element = root as Element;
        const previousAttributes = attributesByElement.get(element);
        for (const attribute of TRANSLATABLE_ATTRIBUTES) {
          const current = element.getAttribute(attribute);
          if (current) {
            const previous = previousAttributes?.get(attribute);
            const source = previous && current === previous.translated ? previous.source : current;
            const translated = translatePhrase(source, language);
            const updated = previousAttributes ?? new Map<string, TranslationRecord>();
            updated.set(attribute, { source, translated });
            attributesByElement.set(element, updated);
            if (current !== translated) element.setAttribute(attribute, translated);
          }
        }
      }
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) translateText(node);
    };

    translateSubtree(document.body);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") translateText(mutation.target);
        mutation.addedNodes.forEach(translateSubtree);
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useSiteLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useSiteLanguage must be used within SiteLanguageProvider");
  return context;
}
