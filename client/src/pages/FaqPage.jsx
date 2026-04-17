import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, HelpCircle, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import { useLanguage } from "../context/LanguageContext";
import PublicLayout from "../layout/PublicLayout";

const copy = {
  en: {
    badge: "Smart FAQ Search",
    title: "Learn about your pain, recovery, and how to get help.",
    description:
      "Search common physiotherapy questions about back pain, neck stiffness, posture, rehab, clinical notes, appointment requests, and treatment sessions.",
    answersAvailable: "answers available",
    guidanceLabel: "Web and mobile patient guidance",
    searchPlaceholder:
      "Ask about back pain, posture, rehab, appointment...",
    categoryCards: [
      "Back pain",
      "Neck stiffness",
      "Posture correction",
      "Sports injury",
      "Doctor reports",
      "Appointment help",
    ],
    helpTitle: "How We Help",
    helpItems: [
      "Understand your symptoms and recovery goal.",
      "Share previous doctor notes and reports after login.",
      "Request an appointment from your patient dashboard.",
      "Track appointment, session, and payment updates in your account.",
    ],
    quickTip: "Quick Tip",
    quickTipText:
      "If you are unsure which FAQ fits your pain, search with simple words like back pain, posture, appointment, note, or report.",
    contactClinic: "Contact the clinic",
    tapToView: "Tap to view answer",
    tapToHide: "Tap to hide answer",
    noMatchTitle: "No matching FAQ found",
    noMatchText:
      "Try a shorter search like pain, posture, report, appointment, or contact us for help.",
    contactUs: "Contact Us",
    faqItems: [
      {
        category: "Pain Relief",
        question: "Can physiotherapy help with back pain?",
        answer:
          "Yes. Physiotherapy can help many back pain cases by improving mobility, reducing muscle tightness, strengthening support muscles, and correcting posture or movement patterns. The exact plan depends on assessment.",
        keywords: ["back pain", "low back", "spine", "pain relief", "posture"],
      },
      {
        category: "Pain Relief",
        question: "What should I do for neck stiffness or shoulder pain?",
        answer:
          "Avoid forceful stretching at home. A physiotherapist can check posture, muscle tightness, joint movement, and daily habits, then guide safe exercises and treatment.",
        keywords: ["neck", "shoulder", "stiffness", "office posture", "cervical"],
      },
      {
        category: "Rehab",
        question: "Do you support post-injury rehabilitation?",
        answer:
          "Yes. Omm Physio World supports guided rehabilitation after sprain, strain, sports injury, weakness, or mobility restriction. Rehab usually includes pain control, movement retraining, strengthening, and gradual return to activity.",
        keywords: ["injury", "rehab", "sports", "sprain", "weakness"],
      },
      {
        category: "Posture",
        question: "Can posture correction reduce recurring pain?",
        answer:
          "In many cases, yes. Poor sitting, phone use, work setup, and muscle imbalance can increase strain. We help patients understand their posture habits and follow practical correction exercises.",
        keywords: ["posture", "office", "desk", "recurring pain", "ergonomics"],
      },
      {
        category: "Treatment",
        question: "How many sessions will I need?",
        answer:
          "It depends on the condition, pain duration, strength, mobility, and recovery goal. After assessment, the clinic team can suggest a practical treatment/session plan.",
        keywords: ["session", "treatment plan", "how many", "duration"],
      },
      {
        category: "Appointments",
        question: "How do I book an appointment?",
        answer:
          "Create a patient account, login, and request an appointment from your dashboard. The clinic team can approve or reschedule it, and the update will be visible in your web and mobile account.",
        keywords: ["appointment", "book", "reschedule", "approve", "login"],
      },
      {
        category: "Clinical Notes",
        question: "Can I share previous doctor notes or reports?",
        answer:
          "Yes. After login, you can add clinical notes and upload PDF or image documents from your dashboard. These documents help the clinic understand your history before planning care.",
        keywords: ["clinical notes", "report", "pdf", "image", "doctor notes"],
      },
      {
        category: "Help",
        question: "What if I am not sure which service I need?",
        answer:
          "Use Live Chat if a staff member is online, or send a message from the contact form. You can briefly describe your pain, duration, and previous treatment so the team can guide the next step.",
        keywords: ["help", "which service", "live chat", "contact", "guidance"],
      },
    ],
  },
  hi: {
    badge: "à¤¸à¥à¤®à¤¾à¤°à¥à¤Ÿ FAQ à¤–à¥‹à¤œ",
    title: "à¤…à¤ªà¤¨à¥‡ à¤¦à¤°à¥à¤¦, à¤°à¤¿à¤•à¤µà¤°à¥€ à¤”à¤° à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾ à¤ªà¤¾à¤¨à¥‡ à¤•à¥‡ à¤¤à¤°à¥€à¤•à¥‡ à¤•à¥‹ à¤¸à¤®à¤à¥‡à¤‚à¥¤",
    description:
      "à¤•à¤®à¤° à¤¦à¤°à¥à¤¦, à¤—à¤°à¥à¤¦à¤¨ à¤œà¤•à¤¡à¤¼à¤¨, à¤ªà¥‹à¤¸à¥à¤Ÿà¤°, à¤°à¤¿à¤¹à¥ˆà¤¬, à¤•à¥à¤²à¤¿à¤¨à¤¿à¤•à¤² à¤¨à¥‹à¤Ÿà¥à¤¸, à¤…à¤ªà¥‰à¤‡à¤‚à¤Ÿà¤®à¥‡à¤‚à¤Ÿ à¤…à¤¨à¥à¤°à¥‹à¤§ à¤”à¤° à¤Ÿà¥à¤°à¥€à¤Ÿà¤®à¥‡à¤‚à¤Ÿ à¤¸à¥‡à¤¶à¤¨ à¤¸à¥‡ à¤œà¥à¤¡à¤¼à¥‡ à¤¸à¤¾à¤®à¤¾à¤¨à¥à¤¯ à¤«à¤¿à¤œà¤¿à¤¯à¥‹à¤¥à¥‡à¤°à¥‡à¤ªà¥€ à¤¸à¤µà¤¾à¤² à¤–à¥‹à¤œà¥‡à¤‚à¥¤",
    answersAvailable: "à¤‰à¤¤à¥à¤¤à¤° à¤‰à¤ªà¤²à¤¬à¥à¤§",
    guidanceLabel: "à¤µà¥‡à¤¬ à¤”à¤° à¤®à¥‹à¤¬à¤¾à¤‡à¤² à¤°à¥‹à¤—à¥€ à¤®à¤¾à¤°à¥à¤—à¤¦à¤°à¥à¤¶à¤¨",
    searchPlaceholder:
      "à¤•à¤®à¤° à¤¦à¤°à¥à¤¦, à¤ªà¥‹à¤¸à¥à¤Ÿà¤°, à¤°à¤¿à¤¹à¥ˆà¤¬, à¤…à¤ªà¥‰à¤‡à¤‚à¤Ÿà¤®à¥‡à¤‚à¤Ÿ à¤•à¥‡ à¤¬à¤¾à¤°à¥‡ à¤®à¥‡à¤‚ à¤ªà¥‚à¤›à¥‡à¤‚...",
    categoryCards: [
      "à¤•à¤®à¤° à¤¦à¤°à¥à¤¦",
      "à¤—à¤°à¥à¤¦à¤¨ à¤œà¤•à¤¡à¤¼à¤¨",
      "à¤ªà¥‹à¤¸à¥à¤Ÿà¤° à¤¸à¥à¤§à¤¾à¤°",
      "à¤¸à¥à¤ªà¥‹à¤°à¥à¤Ÿà¥à¤¸ à¤‡à¤‚à¤œà¤°à¥€",
      "à¤¡à¥‰à¤•à¥à¤Ÿà¤° à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ",
      "à¤…à¤ªà¥‰à¤‡à¤‚à¤Ÿà¤®à¥‡à¤‚à¤Ÿ à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾",
    ],
    helpTitle: "à¤¹à¤® à¤•à¥ˆà¤¸à¥‡ à¤®à¤¦à¤¦ à¤•à¤°à¤¤à¥‡ à¤¹à¥ˆà¤‚",
    helpItems: [
      "à¤…à¤ªà¤¨à¥‡ à¤²à¤•à¥à¤·à¤£ à¤”à¤° à¤°à¤¿à¤•à¤µà¤°à¥€ à¤²à¤•à¥à¤·à¥à¤¯ à¤•à¥‹ à¤¸à¤®à¤à¥‡à¤‚à¥¤",
      "à¤²à¥‰à¤—à¤¿à¤¨ à¤•à¥‡ à¤¬à¤¾à¤¦ à¤ªà¥à¤°à¤¾à¤¨à¥‡ à¤¡à¥‰à¤•à¥à¤Ÿà¤° à¤¨à¥‹à¤Ÿà¥à¤¸ à¤”à¤° à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤¸à¤¾à¤à¤¾ à¤•à¤°à¥‡à¤‚à¥¤",
      "à¤…à¤ªà¤¨à¥‡ à¤°à¥‹à¤—à¥€ à¤¡à¥ˆà¤¶à¤¬à¥‹à¤°à¥à¤¡ à¤¸à¥‡ à¤…à¤ªà¥‰à¤‡à¤‚à¤Ÿà¤®à¥‡à¤‚à¤Ÿ à¤…à¤¨à¥à¤°à¥‹à¤§ à¤­à¥‡à¤œà¥‡à¤‚à¥¤",
      "à¤…à¤ªà¤¨à¥‡ à¤–à¤¾à¤¤à¥‡ à¤®à¥‡à¤‚ à¤…à¤ªà¥‰à¤‡à¤‚à¤Ÿà¤®à¥‡à¤‚à¤Ÿ, à¤¸à¥‡à¤¶à¤¨ à¤”à¤° à¤ªà¥‡à¤®à¥‡à¤‚à¤Ÿ à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤¦à¥‡à¤–à¥‡à¤‚à¥¤",
    ],
    quickTip: "à¤¤à¥à¤µà¤°à¤¿à¤¤ à¤¸à¥à¤à¤¾à¤µ",
    quickTipText:
      "à¤¯à¤¦à¤¿ à¤¸à¤¹à¥€ FAQ à¤¸à¤®à¤ à¤¨à¤¹à¥€à¤‚ à¤† à¤°à¤¹à¤¾ à¤¹à¥ˆ, à¤¤à¥‹ à¤•à¤®à¤° à¤¦à¤°à¥à¤¦, à¤ªà¥‹à¤¸à¥à¤Ÿà¤°, à¤…à¤ªà¥‰à¤‡à¤‚à¤Ÿà¤®à¥‡à¤‚à¤Ÿ, à¤¨à¥‹à¤Ÿ à¤¯à¤¾ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤œà¥ˆà¤¸à¥‡ à¤¸à¤°à¤² à¤¶à¤¬à¥à¤¦ à¤–à¥‹à¤œà¥‡à¤‚à¥¤",
    contactClinic: "à¤•à¥à¤²à¤¿à¤¨à¤¿à¤• à¤¸à¥‡ à¤¸à¤‚à¤ªà¤°à¥à¤• à¤•à¤°à¥‡à¤‚",
    tapToView: "à¤‰à¤¤à¥à¤¤à¤° à¤¦à¥‡à¤–à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤Ÿà¥ˆà¤ª à¤•à¤°à¥‡à¤‚",
    tapToHide: "à¤‰à¤¤à¥à¤¤à¤° à¤›à¤¿à¤ªà¤¾à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤Ÿà¥ˆà¤ª à¤•à¤°à¥‡à¤‚",
    noMatchTitle: "à¤•à¥‹à¤ˆ à¤®à¥‡à¤² à¤–à¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¤¾ FAQ à¤¨à¤¹à¥€à¤‚ à¤®à¤¿à¤²à¤¾",
    noMatchText:
      "à¤¦à¤°à¥à¤¦, à¤ªà¥‹à¤¸à¥à¤Ÿà¤°, à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤¯à¤¾ à¤…à¤ªà¥‰à¤‡à¤‚à¤Ÿà¤®à¥‡à¤‚à¤Ÿ à¤œà¥ˆà¤¸à¥‡ à¤›à¥‹à¤Ÿà¥‡ à¤¶à¤¬à¥à¤¦ à¤–à¥‹à¤œà¥‡à¤‚, à¤¯à¤¾ à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤¹à¤®à¤¸à¥‡ à¤¸à¤‚à¤ªà¤°à¥à¤• à¤•à¤°à¥‡à¤‚à¥¤",
    contactUs: "à¤¸à¤‚à¤ªà¤°à¥à¤• à¤•à¤°à¥‡à¤‚",
    faqItems: [
      {
        category: "à¤¦à¤°à¥à¤¦ à¤¸à¥‡ à¤°à¤¾à¤¹à¤¤",
        question: "à¤•à¥à¤¯à¤¾ à¤«à¤¿à¤œà¤¿à¤¯à¥‹à¤¥à¥‡à¤°à¥‡à¤ªà¥€ à¤•à¤®à¤° à¤¦à¤°à¥à¤¦ à¤®à¥‡à¤‚ à¤®à¤¦à¤¦ à¤•à¤° à¤¸à¤•à¤¤à¥€ à¤¹à¥ˆ?",
        answer:
          "à¤¹à¤¾à¤à¥¤ à¤«à¤¿à¤œà¤¿à¤¯à¥‹à¤¥à¥‡à¤°à¥‡à¤ªà¥€ à¤•à¤®à¤° à¤¦à¤°à¥à¤¦ à¤•à¥‡ à¤•à¤ˆ à¤®à¤¾à¤®à¤²à¥‹à¤‚ à¤®à¥‡à¤‚ à¤®à¥‚à¤µà¤®à¥‡à¤‚à¤Ÿ à¤¬à¥‡à¤¹à¤¤à¤° à¤•à¤°à¤•à¥‡, à¤®à¤¾à¤‚à¤¸à¤ªà¥‡à¤¶à¤¿à¤¯à¥‹à¤‚ à¤•à¥€ à¤œà¤•à¤¡à¤¼à¤¨ à¤•à¤® à¤•à¤°à¤•à¥‡, à¤¸à¤¹à¤¾à¤¯à¤• à¤®à¤¾à¤‚à¤¸à¤ªà¥‡à¤¶à¤¿à¤¯à¥‹à¤‚ à¤•à¥‹ à¤®à¤œà¤¬à¥‚à¤¤ à¤•à¤°à¤•à¥‡ à¤”à¤° à¤ªà¥‹à¤¸à¥à¤Ÿà¤° à¤¸à¥à¤§à¤¾à¤°à¤•à¤° à¤®à¤¦à¤¦ à¤•à¤° à¤¸à¤•à¤¤à¥€ à¤¹à¥ˆà¥¤ à¤¸à¤¹à¥€ à¤¯à¥‹à¤œà¤¨à¤¾ à¤œà¤¾à¤‚à¤š à¤•à¥‡ à¤¬à¤¾à¤¦ à¤¤à¤¯ à¤¹à¥‹à¤¤à¥€ à¤¹à¥ˆà¥¤",
        keywords: ["à¤•à¤®à¤° à¤¦à¤°à¥à¤¦", "à¤¬à¥ˆà¤• à¤ªà¥‡à¤¨", "à¤°à¥€à¤¢à¤¼", "à¤¦à¤°à¥à¤¦ à¤°à¤¾à¤¹à¤¤", "à¤ªà¥‹à¤¸à¥à¤Ÿà¤°"],
      },
      {
        category: "à¤¦à¤°à¥à¤¦ à¤¸à¥‡ à¤°à¤¾à¤¹à¤¤",
        question: "à¤—à¤°à¥à¤¦à¤¨ à¤œà¤•à¤¡à¤¼à¤¨ à¤¯à¤¾ à¤•à¤‚à¤§à¥‡ à¤•à¥‡ à¤¦à¤°à¥à¤¦ à¤®à¥‡à¤‚ à¤•à¥à¤¯à¤¾ à¤•à¤°à¤¨à¤¾ à¤šà¤¾à¤¹à¤¿à¤?",
        answer:
          "à¤˜à¤° à¤ªà¤° à¤œà¥‹à¤° à¤¸à¥‡ à¤¸à¥à¤Ÿà¥à¤°à¥‡à¤š à¤¨ à¤•à¤°à¥‡à¤‚à¥¤ à¤«à¤¿à¤œà¤¿à¤¯à¥‹à¤¥à¥‡à¤°à¥‡à¤ªà¤¿à¤¸à¥à¤Ÿ à¤ªà¥‹à¤¸à¥à¤Ÿà¤°, à¤®à¤¾à¤‚à¤¸à¤ªà¥‡à¤¶à¤¿à¤¯à¥‹à¤‚ à¤•à¥€ à¤œà¤•à¤¡à¤¼à¤¨, à¤œà¥‹à¤¡à¤¼ à¤•à¥€ à¤®à¥‚à¤µà¤®à¥‡à¤‚à¤Ÿ à¤”à¤° à¤°à¥‹à¤œà¤¼à¤®à¤°à¥à¤°à¤¾ à¤•à¥€ à¤†à¤¦à¤¤à¥‹à¤‚ à¤•à¥€ à¤œà¤¾à¤‚à¤š à¤•à¤°à¤•à¥‡ à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤à¤•à¥à¤¸à¤°à¤¸à¤¾à¤‡à¤œà¤¼ à¤”à¤° à¤Ÿà¥à¤°à¥€à¤Ÿà¤®à¥‡à¤‚à¤Ÿ à¤¬à¤¤à¤¾à¤à¤‚à¤—à¥‡à¥¤",
        keywords: ["à¤—à¤°à¥à¤¦à¤¨", "à¤•à¤‚à¤§à¤¾", "à¤œà¤•à¤¡à¤¼à¤¨", "à¤‘à¤«à¤¿à¤¸ à¤ªà¥‹à¤¸à¥à¤Ÿà¤°", "à¤¸à¤°à¥à¤µà¤¾à¤‡à¤•à¤²"],
      },
      {
        category: "à¤°à¤¿à¤¹à¥ˆà¤¬",
        question: "à¤•à¥à¤¯à¤¾ à¤†à¤ª à¤šà¥‹à¤Ÿ à¤•à¥‡ à¤¬à¤¾à¤¦ à¤°à¤¿à¤¹à¥ˆà¤¬à¤¿à¤²à¤¿à¤Ÿà¥‡à¤¶à¤¨ à¤®à¥‡à¤‚ à¤®à¤¦à¤¦ à¤•à¤°à¤¤à¥‡ à¤¹à¥ˆà¤‚?",
        answer:
          "à¤¹à¤¾à¤à¥¤ Omm Physio World à¤®à¥‹à¤š, à¤¸à¥à¤Ÿà¥à¤°à¥‡à¤¨, à¤¸à¥à¤ªà¥‹à¤°à¥à¤Ÿà¥à¤¸ à¤‡à¤‚à¤œà¤°à¥€, à¤•à¤®à¤œà¥‹à¤°à¥€ à¤¯à¤¾ à¤®à¥‚à¤µà¤®à¥‡à¤‚à¤Ÿ à¤•à¥€ à¤¸à¤®à¤¸à¥à¤¯à¤¾ à¤•à¥‡ à¤¬à¤¾à¤¦ à¤—à¤¾à¤‡à¤¡à¥‡à¤¡ à¤°à¤¿à¤¹à¥ˆà¤¬ à¤¦à¥‡à¤¤à¤¾ à¤¹à¥ˆà¥¤ à¤‡à¤¸à¤®à¥‡à¤‚ à¤¦à¤°à¥à¤¦ à¤¨à¤¿à¤¯à¤‚à¤¤à¥à¤°à¤£, à¤®à¥‚à¤µà¤®à¥‡à¤‚à¤Ÿ à¤Ÿà¥à¤°à¥‡à¤¨à¤¿à¤‚à¤—, à¤¸à¥à¤Ÿà¥à¤°à¥‡à¤‚à¤¥ à¤¬à¤¢à¤¼à¤¾à¤¨à¤¾ à¤”à¤° à¤§à¥€à¤°à¥‡-à¤§à¥€à¤°à¥‡ à¤¸à¤¾à¤®à¤¾à¤¨à¥à¤¯ à¤—à¤¤à¤¿à¤µà¤¿à¤§à¤¿ à¤®à¥‡à¤‚ à¤µà¤¾à¤ªà¤¸à¥€ à¤¶à¤¾à¤®à¤¿à¤² à¤¹à¥‹à¤¤à¥€ à¤¹à¥ˆà¥¤",
        keywords: ["à¤šà¥‹à¤Ÿ", "à¤°à¤¿à¤¹à¥ˆà¤¬", "à¤¸à¥à¤ªà¥‹à¤°à¥à¤Ÿà¥à¤¸", "à¤®à¥‹à¤š", "à¤•à¤®à¤œà¥‹à¤°à¥€"],
      },
      {
        category: "à¤ªà¥‹à¤¸à¥à¤Ÿà¤°",
        question: "à¤•à¥à¤¯à¤¾ à¤ªà¥‹à¤¸à¥à¤Ÿà¤° à¤¸à¥à¤§à¤¾à¤°à¤¨à¥‡ à¤¸à¥‡ à¤¬à¤¾à¤°-à¤¬à¤¾à¤° à¤¹à¥‹à¤¨à¥‡ à¤µà¤¾à¤²à¤¾ à¤¦à¤°à¥à¤¦ à¤•à¤® à¤¹à¥‹ à¤¸à¤•à¤¤à¤¾ à¤¹à¥ˆ?",
        answer:
          "à¤•à¤ˆ à¤®à¤¾à¤®à¤²à¥‹à¤‚ à¤®à¥‡à¤‚ à¤¹à¤¾à¤à¥¤ à¤—à¤²à¤¤ à¤¬à¥ˆà¤ à¤¨à¤¾, à¤®à¥‹à¤¬à¤¾à¤‡à¤² à¤•à¤¾ à¤œà¥à¤¯à¤¾à¤¦à¤¾ à¤‰à¤ªà¤¯à¥‹à¤—, à¤–à¤°à¤¾à¤¬ à¤µà¤°à¥à¤• à¤¸à¥‡à¤Ÿà¤…à¤ª à¤”à¤° à¤®à¤¾à¤‚à¤¸à¤ªà¥‡à¤¶à¤¿à¤¯à¥‹à¤‚ à¤•à¤¾ à¤…à¤¸à¤‚à¤¤à¥à¤²à¤¨ à¤¶à¤°à¥€à¤° à¤ªà¤° à¤¤à¤¨à¤¾à¤µ à¤¬à¤¢à¤¼à¤¾à¤¤à¥‡ à¤¹à¥ˆà¤‚à¥¤ à¤¹à¤® à¤°à¥‹à¤—à¤¿à¤¯à¥‹à¤‚ à¤•à¥‹ à¤‰à¤¨à¤•à¥€ à¤ªà¥‹à¤¸à¥à¤Ÿà¤° à¤†à¤¦à¤¤à¥‡à¤‚ à¤¸à¤®à¤à¤¾à¤•à¤° à¤µà¥à¤¯à¤¾à¤µà¤¹à¤¾à¤°à¤¿à¤• à¤¸à¥à¤§à¤¾à¤° à¤à¤•à¥à¤¸à¤°à¤¸à¤¾à¤‡à¤œà¤¼ à¤¦à¥‡à¤¤à¥‡ à¤¹à¥ˆà¤‚à¥¤",
        keywords: ["à¤ªà¥‹à¤¸à¥à¤Ÿà¤°", "à¤‘à¤«à¤¿à¤¸", "à¤¡à¥‡à¤¸à¥à¤•", "à¤¬à¤¾à¤°-à¤¬à¤¾à¤° à¤¦à¤°à¥à¤¦", "à¤à¤°à¥à¤—à¥‹à¤¨à¥‰à¤®à¤¿à¤•à¥à¤¸"],
      },
      {
        category: "à¤‰à¤ªà¤šà¤¾à¤°",
        question: "à¤®à¥à¤à¥‡ à¤•à¤¿à¤¤à¤¨à¥‡ à¤¸à¥‡à¤¶à¤¨ à¤•à¥€ à¤†à¤µà¤¶à¥à¤¯à¤•à¤¤à¤¾ à¤¹à¥‹à¤—à¥€?",
        answer:
          "à¤¯à¤¹ à¤†à¤ªà¤•à¥€ à¤¸à¤®à¤¸à¥à¤¯à¤¾, à¤¦à¤°à¥à¤¦ à¤•à¥€ à¤…à¤µà¤§à¤¿, à¤¤à¤¾à¤•à¤¤, à¤®à¥‚à¤µà¤®à¥‡à¤‚à¤Ÿ à¤”à¤° à¤°à¤¿à¤•à¤µà¤°à¥€ à¤²à¤•à¥à¤·à¥à¤¯ à¤ªà¤° à¤¨à¤¿à¤°à¥à¤­à¤° à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆà¥¤ à¤œà¤¾à¤‚à¤š à¤•à¥‡ à¤¬à¤¾à¤¦ à¤•à¥à¤²à¤¿à¤¨à¤¿à¤• à¤Ÿà¥€à¤® à¤†à¤ªà¤•à¥‡ à¤²à¤¿à¤ à¤µà¥à¤¯à¤¾à¤µà¤¹à¤¾à¤°à¤¿à¤• à¤Ÿà¥à¤°à¥€à¤Ÿà¤®à¥‡à¤‚à¤Ÿ à¤¯à¤¾ à¤¸à¥‡à¤¶à¤¨ à¤ªà¥à¤²à¤¾à¤¨ à¤¬à¤¤à¤¾ à¤¸à¤•à¤¤à¥€ à¤¹à¥ˆà¥¤",
        keywords: ["à¤¸à¥‡à¤¶à¤¨", "à¤Ÿà¥à¤°à¥€à¤Ÿà¤®à¥‡à¤‚à¤Ÿ à¤ªà¥à¤²à¤¾à¤¨", "à¤•à¤¿à¤¤à¤¨à¥‡", "à¤…à¤µà¤§à¤¿"],
      },
      {
        category: "à¤…à¤ªà¥‰à¤‡à¤‚à¤Ÿà¤®à¥‡à¤‚à¤Ÿ",
        question: "à¤®à¥ˆà¤‚ à¤…à¤ªà¥‰à¤‡à¤‚à¤Ÿà¤®à¥‡à¤‚à¤Ÿ à¤•à¥ˆà¤¸à¥‡ à¤¬à¥à¤• à¤•à¤°à¥‚à¤‚?",
        answer:
          "à¤°à¥‹à¤—à¥€ à¤–à¤¾à¤¤à¤¾ à¤¬à¤¨à¤¾à¤à¤‚, à¤²à¥‰à¤—à¤¿à¤¨ à¤•à¤°à¥‡à¤‚ à¤”à¤° à¤…à¤ªà¤¨à¥‡ à¤¡à¥ˆà¤¶à¤¬à¥‹à¤°à¥à¤¡ à¤¸à¥‡ à¤…à¤ªà¥‰à¤‡à¤‚à¤Ÿà¤®à¥‡à¤‚à¤Ÿ à¤…à¤¨à¥à¤°à¥‹à¤§ à¤­à¥‡à¤œà¥‡à¤‚à¥¤ à¤•à¥à¤²à¤¿à¤¨à¤¿à¤• à¤Ÿà¥€à¤® à¤‰à¤¸à¥‡ à¤®à¤‚à¤œà¥‚à¤° à¤¯à¤¾ à¤°à¥€à¤¶à¥‡à¤¡à¥à¤¯à¥‚à¤² à¤•à¤° à¤¸à¤•à¤¤à¥€ à¤¹à¥ˆ, à¤”à¤° à¤‰à¤¸à¤•à¤¾ à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤†à¤ªà¤•à¥‡ à¤µà¥‡à¤¬ à¤µ à¤®à¥‹à¤¬à¤¾à¤‡à¤² à¤–à¤¾à¤¤à¥‡ à¤®à¥‡à¤‚ à¤¦à¤¿à¤–à¥‡à¤—à¤¾à¥¤",
        keywords: ["à¤…à¤ªà¥‰à¤‡à¤‚à¤Ÿà¤®à¥‡à¤‚à¤Ÿ", "à¤¬à¥à¤•", "à¤°à¥€à¤¶à¥‡à¤¡à¥à¤¯à¥‚à¤²", "à¤®à¤‚à¤œà¥‚à¤°à¥€", "à¤²à¥‰à¤—à¤¿à¤¨"],
      },
      {
        category: "à¤•à¥à¤²à¤¿à¤¨à¤¿à¤•à¤² à¤¨à¥‹à¤Ÿà¥à¤¸",
        question: "à¤•à¥à¤¯à¤¾ à¤®à¥ˆà¤‚ à¤ªà¥à¤°à¤¾à¤¨à¥‡ à¤¡à¥‰à¤•à¥à¤Ÿà¤° à¤¨à¥‹à¤Ÿà¥à¤¸ à¤¯à¤¾ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤¸à¤¾à¤à¤¾ à¤•à¤° à¤¸à¤•à¤¤à¤¾/à¤¸à¤•à¤¤à¥€ à¤¹à¥‚à¤‚?",
        answer:
          "à¤¹à¤¾à¤à¥¤ à¤²à¥‰à¤—à¤¿à¤¨ à¤•à¥‡ à¤¬à¤¾à¤¦ à¤†à¤ª à¤…à¤ªà¤¨à¥‡ à¤¡à¥ˆà¤¶à¤¬à¥‹à¤°à¥à¤¡ à¤¸à¥‡ à¤•à¥à¤²à¤¿à¤¨à¤¿à¤•à¤² à¤¨à¥‹à¤Ÿà¥à¤¸ à¤œà¥‹à¤¡à¤¼ à¤¸à¤•à¤¤à¥‡ à¤¹à¥ˆà¤‚ à¤”à¤° PDF à¤¯à¤¾ à¤‡à¤®à¥‡à¤œ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œà¤¼ à¤…à¤ªà¤²à¥‹à¤¡ à¤•à¤° à¤¸à¤•à¤¤à¥‡ à¤¹à¥ˆà¤‚à¥¤ à¤‡à¤¸à¤¸à¥‡ à¤•à¥à¤²à¤¿à¤¨à¤¿à¤• à¤†à¤ªà¤•à¥€ à¤ªà¥à¤°à¤¾à¤¨à¥€ à¤®à¥‡à¤¡à¤¿à¤•à¤² à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€ à¤¸à¤®à¤à¤•à¤° à¤¸à¤¹à¥€ à¤¯à¥‹à¤œà¤¨à¤¾ à¤¬à¤¨à¤¾ à¤¸à¤•à¤¤à¤¾ à¤¹à¥ˆà¥¤",
        keywords: ["à¤•à¥à¤²à¤¿à¤¨à¤¿à¤•à¤² à¤¨à¥‹à¤Ÿà¥à¤¸", "à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ", "PDF", "à¤‡à¤®à¥‡à¤œ", "à¤¡à¥‰à¤•à¥à¤Ÿà¤° à¤¨à¥‹à¤Ÿà¥à¤¸"],
      },
      {
        category: "à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾",
        question: "à¤…à¤—à¤° à¤®à¥à¤à¥‡ à¤¸à¤®à¤ à¤¨ à¤†à¤ à¤•à¤¿ à¤•à¥Œà¤¨-à¤¸à¥€ à¤¸à¥‡à¤µà¤¾ à¤šà¤¾à¤¹à¤¿à¤ à¤¤à¥‹ à¤•à¥à¤¯à¤¾ à¤•à¤°à¥‡à¤‚?",
        answer:
          "à¤¯à¤¦à¤¿ à¤¸à¥à¤Ÿà¤¾à¤« à¤‘à¤¨à¤²à¤¾à¤‡à¤¨ à¤¹à¥ˆ à¤¤à¥‹ Live Chat à¤•à¤¾ à¤‰à¤ªà¤¯à¥‹à¤— à¤•à¤°à¥‡à¤‚, à¤¯à¤¾ Contact form à¤¸à¥‡ à¤¸à¤‚à¤¦à¥‡à¤¶ à¤­à¥‡à¤œà¥‡à¤‚à¥¤ à¤†à¤ª à¤…à¤ªà¤¨à¥‡ à¤¦à¤°à¥à¤¦, à¤‰à¤¸à¤•à¥€ à¤…à¤µà¤§à¤¿ à¤”à¤° à¤ªà¥à¤°à¤¾à¤¨à¥‡ à¤‡à¤²à¤¾à¤œ à¤•à¥€ à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€ à¤²à¤¿à¤–à¥‡à¤‚, à¤¤à¤¾à¤•à¤¿ à¤Ÿà¥€à¤® à¤…à¤—à¤²à¤¾ à¤¸à¤¹à¥€ à¤•à¤¦à¤® à¤¬à¤¤à¤¾ à¤¸à¤•à¥‡à¥¤",
        keywords: ["à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾", "à¤•à¥Œà¤¨-à¤¸à¥€ à¤¸à¥‡à¤µà¤¾", "à¤²à¤¾à¤‡à¤µ à¤šà¥ˆà¤Ÿ", "à¤¸à¤‚à¤ªà¤°à¥à¤•", "à¤®à¤¾à¤°à¥à¤—à¤¦à¤°à¥à¤¶à¤¨"],
      },
    ],
  },
  or: {
    badge: "à¬¸à­à¬®à¬¾à¬°à­à¬Ÿ FAQ à¬¸à¬°à­à¬šà­à¬š",
    title: "à¬†à¬ªà¬£à¬™à­à¬• à¬¬à­‡à¬¦à¬¨à¬¾, à¬¸à­à¬¸à­à¬¥à¬¤à¬¾ à¬à¬¬à¬‚ à¬¸à¬¹à¬¾à­Ÿà¬¤à¬¾ à¬ªà¬¾à¬‡à¬¬à¬¾à¬° à¬‰à¬ªà¬¾à­Ÿ à¬¬à­à¬à¬¨à­à¬¤à­à¥¤",
    description:
      "à¬ªà¬¿à¬ à¬¿ à¬¬à­‡à¬¦à¬¨à¬¾, à¬—à¬°à­à¬¦à­à¬§à¬¨ à¬œà¬®à¬¿à¬¯à¬¿à¬¬à¬¾, à¬ªà­‹à¬·à­à¬šà¬°, à¬°à¬¿à¬¹à¬¾à¬¬à­, à¬•à­à¬²à¬¿à¬¨à¬¿à¬•à¬¾à¬² à¬¨à­‹à¬Ÿà­à¬¸, à¬…à¬ªà¬à¬£à­à¬Ÿà¬®à­‡à¬£à­à¬Ÿ à¬…à¬¨à­à¬°à­‹à¬§ à¬à¬¬à¬‚ à¬Ÿà­à¬°à¬¿à¬Ÿà¬®à­‡à¬£à­à¬Ÿ à¬¸à­‡à¬¸à¬¨à­ à¬¸à¬®à­à¬¬à¬¨à­à¬§à¬¿à¬¤ à¬¸à¬¾à¬§à¬¾à¬°à¬£ à¬«à¬¿à¬œà¬¿à¬“à¬¥à­‡à¬°à¬¾à¬ªà¬¿ à¬ªà­à¬°à¬¶à­à¬¨ à¬–à­‹à¬œà¬¨à­à¬¤à­à¥¤",
    answersAvailable: "à¬‰à¬¤à­à¬¤à¬° à¬‰à¬ªà¬²à¬¬à­à¬§",
    guidanceLabel: "à­±à­‡à¬¬ à¬à¬¬à¬‚ à¬®à­‹à¬¬à¬¾à¬‡à¬² à¬°à­‹à¬—à­€ à¬®à¬¾à¬°à­à¬—à¬¦à¬°à­à¬¶à¬¨",
    searchPlaceholder:
      "à¬ªà¬¿à¬ à¬¿ à¬¬à­‡à¬¦à¬¨à¬¾, à¬ªà­‹à¬·à­à¬šà¬°, à¬°à¬¿à¬¹à¬¾à¬¬à­, à¬…à¬ªà¬à¬£à­à¬Ÿà¬®à­‡à¬£à­à¬Ÿ à¬¬à¬¿à¬·à­Ÿà¬°à­‡ à¬ªà¬šà¬¾à¬°à¬¨à­à¬¤à­...",
    categoryCards: [
      "à¬ªà¬¿à¬ à¬¿ à¬¬à­‡à¬¦à¬¨à¬¾",
      "à¬—à¬°à­à¬¦à­à¬§à¬¨ à¬œà¬®à¬¿à¬¬à¬¾",
      "à¬ªà­‹à¬·à­à¬šà¬° à¬¸à¬ à¬¿à¬• à¬•à¬°à¬¿à¬¬à¬¾",
      "à¬¸à­à¬ªà­‹à¬°à­à¬Ÿà¬¸à­ à¬‡à¬žà­à¬œà­à¬°à¬¿",
      "à¬¡à¬¾à¬•à­à¬¤à¬° à¬°à¬¿à¬ªà­‹à¬°à­à¬Ÿ",
      "à¬…à¬ªà¬à¬£à­à¬Ÿà¬®à­‡à¬£à­à¬Ÿ à¬¸à¬¹à¬¾à­Ÿà¬¤à¬¾",
    ],
    helpTitle: "à¬†à¬®à­‡ à¬•à¬¿à¬ªà¬°à¬¿ à¬¸à¬¾à¬¹à¬¾à¬¯à­à­Ÿ à¬•à¬°à­à¬›à­",
    helpItems: [
      "à¬†à¬ªà¬£à¬™à­à¬• à¬²à¬•à­à¬·à¬£ à¬à¬¬à¬‚ à¬¸à­à¬¸à­à¬¥à¬¤à¬¾ à¬²à¬•à­à¬·à­à­Ÿ à¬¬à­à¬à¬¨à­à¬¤à­à¥¤",
      "à¬²à¬—à¬‡à¬¨à­ à¬ªà¬°à­‡ à¬ªà­à¬°à­à¬£à¬¾ à¬¡à¬¾à¬•à­à¬¤à¬° à¬¨à­‹à¬Ÿà­ à¬à¬¬à¬‚ à¬°à¬¿à¬ªà­‹à¬°à­à¬Ÿ à¬¶à­‡à­Ÿà¬° à¬•à¬°à¬¨à­à¬¤à­à¥¤",
      "à¬°à­‹à¬—à­€ à¬¡à¬¾à¬¶à¬¬à­‹à¬°à­à¬¡à¬°à­ à¬…à¬ªà¬à¬£à­à¬Ÿà¬®à­‡à¬£à­à¬Ÿ à¬…à¬¨à­à¬°à­‹à¬§ à¬ªà¬ à¬¾à¬¨à­à¬¤à­à¥¤",
      "à¬†à¬ªà¬£à¬™à­à¬• à¬†à¬•à¬¾à¬‰à¬£à­à¬Ÿà¬°à­‡ à¬…à¬ªà¬à¬£à­à¬Ÿà¬®à­‡à¬£à­à¬Ÿ, à¬¸à­‡à¬¸à¬¨à­ à¬à¬¬à¬‚ à¬ªà­‡à¬®à­‡à¬£à­à¬Ÿ à¬…à¬ªà¬¡à­‡à¬Ÿà­ à¬¦à­‡à¬–à¬¨à­à¬¤à­à¥¤",
    ],
    quickTip: "à¬¦à­à¬°à­à¬¤ à¬¸à­à¬ªà¬¾à¬°à¬¿à¬¶",
    quickTipText:
      "à¬¯à¬¦à¬¿ à¬¸à¬ à¬¿à¬• FAQ à¬¬à­à¬à¬¿à¬ªà¬¾à¬°à­à¬¨à¬¾à¬¹à¬¾à¬¨à­à¬¤à¬¿, à¬¤à­‡à¬¬à­‡ à¬ªà¬¿à¬ à¬¿ à¬¬à­‡à¬¦à¬¨à¬¾, à¬ªà­‹à¬·à­à¬šà¬°, à¬…à¬ªà¬à¬£à­à¬Ÿà¬®à­‡à¬£à­à¬Ÿ, à¬¨à­‹à¬Ÿà­ à¬•à¬¿à¬®à­à¬¬à¬¾ à¬°à¬¿à¬ªà­‹à¬°à­à¬Ÿ à¬­à¬³à¬¿ à¬¸à¬°à¬³ à¬¶à¬¬à­à¬¦à¬°à­‡ à¬–à­‹à¬œà¬¨à­à¬¤à­à¥¤",
    contactClinic: "à¬•à­à¬²à¬¿à¬¨à¬¿à¬• à¬¸à¬¹à¬¿à¬¤ à¬¯à­‹à¬—à¬¾à¬¯à­‹à¬— à¬•à¬°à¬¨à­à¬¤à­",
    tapToView: "à¬‰à¬¤à­à¬¤à¬° à¬¦à­‡à¬–à¬¿à¬¬à¬¾ à¬ªà¬¾à¬‡à¬ à¬Ÿà¬¾à¬ª à¬•à¬°à¬¨à­à¬¤à­",
    tapToHide: "à¬‰à¬¤à­à¬¤à¬° à¬²à­à¬šà¬¾à¬‡à¬¬à¬¾ à¬ªà¬¾à¬‡à¬ à¬Ÿà¬¾à¬ª à¬•à¬°à¬¨à­à¬¤à­",
    noMatchTitle: "à¬®à­‡à¬³ à¬¹à­‹à¬‡à¬¥à¬¿à¬¬à¬¾ FAQ à¬®à¬¿à¬³à¬¿à¬²à¬¾ à¬¨à¬¾à¬¹à¬¿à¬",
    noMatchText:
      "à¬¬à­‡à¬¦à¬¨à¬¾, à¬ªà­‹à¬·à­à¬šà¬°, à¬°à¬¿à¬ªà­‹à¬°à­à¬Ÿ à¬•à¬¿à¬®à­à¬¬à¬¾ à¬…à¬ªà¬à¬£à­à¬Ÿà¬®à­‡à¬£à­à¬Ÿ à¬­à¬³à¬¿ à¬›à­‹à¬Ÿ à¬¶à¬¬à­à¬¦à¬°à­‡ à¬–à­‹à¬œà¬¨à­à¬¤à­, à¬•à¬¿à¬®à­à¬¬à¬¾ à¬¸à¬¹à¬¾à­Ÿà¬¤à¬¾ à¬ªà¬¾à¬‡à¬ à¬†à¬® à¬¸à¬¹à¬¿à¬¤ à¬¯à­‹à¬—à¬¾à¬¯à­‹à¬— à¬•à¬°à¬¨à­à¬¤à­à¥¤",
    contactUs: "à¬¯à­‹à¬—à¬¾à¬¯à­‹à¬— à¬•à¬°à¬¨à­à¬¤à­",
    faqItems: [
      {
        category: "à¬¬à­‡à¬¦à¬¨à¬¾ à¬¹à­à¬°à¬¾à¬¸",
        question: "à¬«à¬¿à¬œà¬¿à¬“à¬¥à­‡à¬°à¬¾à¬ªà¬¿ à¬ªà¬¿à¬ à¬¿ à¬¬à­‡à¬¦à¬¨à¬¾à¬°à­‡ à¬¸à¬¾à¬¹à¬¾à¬¯à­à­Ÿ à¬•à¬°à¬¿à¬ªà¬¾à¬°à­‡ à¬•à¬¿?",
        answer:
          "à¬¹à¬à¥¤ à¬«à¬¿à¬œà¬¿à¬“à¬¥à­‡à¬°à¬¾à¬ªà¬¿ à¬…à¬¨à­‡à¬• à¬ªà¬¿à¬ à¬¿ à¬¬à­‡à¬¦à¬¨à¬¾ à¬®à¬¾à¬®à¬²à¬¾à¬°à­‡ à¬šà¬³à¬¨ à¬­à¬² à¬•à¬°à¬¿à¬¬à¬¾, à¬®à¬¾à¬‚à¬¸à¬ªà­‡à¬¶à­€ à¬œà¬®à¬¿à¬¬à¬¾ à¬•à¬®à¬¾à¬‡à¬¬à¬¾, à¬¸à¬¹à¬¾à­Ÿà¬• à¬®à¬¾à¬‚à¬¸à¬ªà­‡à¬¶à­€ à¬¶à¬•à­à¬¤à¬¿à¬¶à¬¾à¬³à­€ à¬•à¬°à¬¿à¬¬à¬¾ à¬à¬¬à¬‚ à¬ªà­‹à¬·à­à¬šà¬° à¬¸à¬ à¬¿à¬• à¬•à¬°à¬¿à¬¬à¬¾à¬°à­‡ à¬¸à¬¹à¬¾à¬¯à­à­Ÿ à¬•à¬°à­‡à¥¤ à¬ à¬¿à¬• à¬ªà­à¬²à¬¾à¬¨à­ à¬šà­‡à¬•à¬…à¬ªà­ à¬ªà¬°à­‡ à¬¨à¬¿à¬°à­à¬§à¬¾à¬°à¬£ à¬¹à­à¬à¥¤",
        keywords: ["à¬ªà¬¿à¬ à¬¿ à¬¬à­‡à¬¦à¬¨à¬¾", "à¬¬à­à­Ÿà¬¾à¬• à¬ªà­‡à¬¨", "à¬®à­‡à¬¦à­à¬²à¬¾", "à¬¬à­‡à¬¦à¬¨à¬¾ à¬¹à­à¬°à¬¾à¬¸", "à¬ªà­‹à¬·à­à¬šà¬°"],
      },
      {
        category: "à¬¬à­‡à¬¦à¬¨à¬¾ à¬¹à­à¬°à¬¾à¬¸",
        question: "à¬—à¬°à­à¬¦à­à¬§à¬¨ à¬œà¬®à¬¿à¬¯à¬¿à¬¬à¬¾ à¬•à¬¿à¬®à­à¬¬à¬¾ à¬•à¬¾à¬¨à­à¬§ à¬¬à­‡à¬¦à¬¨à¬¾ à¬¹à­‡à¬²à­‡ à¬•à¬£ à¬•à¬°à¬¿à¬¬à¬¿?",
        answer:
          "à¬˜à¬°à­‡ à¬œà­‹à¬°à¬•à¬°à¬¿ à¬·à­à¬Ÿà­à¬°à­‡à¬šà­ à¬•à¬°à¬¿à¬¬à­‡à¬¨à¬¿à¥¤ à¬«à¬¿à¬œà¬¿à¬“à¬¥à­‡à¬°à¬¾à¬ªà¬¿à¬·à­à¬Ÿ à¬ªà­‹à¬·à­à¬šà¬°, à¬®à¬¾à¬‚à¬¸à¬ªà­‡à¬¶à­€ à¬œà¬®à¬¿à¬¬à¬¾, à¬¯à­‹à¬‡à¬£à­à¬Ÿ à¬®à­à¬­à¬®à­‡à¬£à­à¬Ÿ à¬à¬¬à¬‚ à¬¦à­ˆà¬¨à¬¿à¬• à¬…à¬­à­à­Ÿà¬¾à¬¸ à¬¯à¬¾à¬žà­à¬š à¬•à¬°à¬¿ à¬¸à­à¬°à¬•à­à¬·à¬¿à¬¤ à¬¬à­à­Ÿà¬¾à­Ÿà¬¾à¬® à¬“ à¬šà¬¿à¬•à¬¿à¬¤à­à¬¸à¬¾ à¬¦à­‡à¬¬à­‡à¥¤",
        keywords: ["à¬—à¬°à­à¬¦à­à¬§à¬¨", "à¬•à¬¾à¬¨à­à¬§", "à¬œà¬®à¬¿à¬¬à¬¾", "à¬…à¬«à¬¿à¬¸ à¬ªà­‹à¬·à­à¬šà¬°", "à¬¸à¬°à­à¬­à¬¾à¬‡à¬•à¬¾à¬²"],
      },
      {
        category: "à¬°à¬¿à¬¹à¬¾à¬¬à­",
        question: "à¬šà­‹à¬Ÿ à¬ªà¬°à­‡ à¬°à¬¿à¬¹à¬¾à¬¬à¬¿à¬²à¬¿à¬Ÿà­‡à¬¸à¬¨à­ à¬¸à¬¹à¬¾à­Ÿà¬¤à¬¾ à¬®à¬¿à¬³à­‡ à¬•à¬¿?",
        answer:
          "à¬¹à¬à¥¤ Omm Physio World à¬®à­‹à¬š, à¬·à­à¬Ÿà­à¬°à­‡à¬¨à­, à¬¸à­à¬ªà­‹à¬°à­à¬Ÿà¬¸à­ à¬‡à¬žà­à¬œà­à¬°à¬¿, à¬¦à­à¬°à­à¬¬à¬³à¬¤à¬¾ à¬•à¬¿à¬®à­à¬¬à¬¾ à¬šà¬³à¬¨ à¬¸à¬®à¬¸à­à­Ÿà¬¾ à¬ªà¬°à­‡ à¬—à¬¾à¬‡à¬¡à­‡à¬¡à­ à¬°à¬¿à¬¹à¬¾à¬¬à­ à¬¦à­‡à¬‡à¬¥à¬¾à¬à¥¤ à¬à¬¥à¬¿à¬°à­‡ à¬¬à­‡à¬¦à¬¨à¬¾ à¬¨à¬¿à­Ÿà¬¨à­à¬¤à­à¬°à¬£, à¬šà¬³à¬¨ à¬…à¬­à­à­Ÿà¬¾à¬¸, à¬¶à¬•à­à¬¤à¬¿à¬¬à¬°à­à¬¦à­à¬§à¬¨ à¬à¬¬à¬‚ à¬§à­€à¬°à­‡ à¬§à­€à¬°à­‡ à¬¸à¬¾à¬§à¬¾à¬°à¬£ à¬•à¬¾à¬°à­à¬¯à­à­Ÿà¬•à­ à¬«à­‡à¬°à¬¾à¬‡à¬¬à¬¾ à¬¥à¬¾à¬à¥¤",
        keywords: ["à¬šà­‹à¬Ÿ", "à¬°à¬¿à¬¹à¬¾à¬¬à­", "à¬¸à­à¬ªà­‹à¬°à­à¬Ÿà¬¸à­", "à¬®à­‹à¬š", "à¬¦à­à¬°à­à¬¬à¬³à¬¤à¬¾"],
      },
      {
        category: "à¬ªà­‹à¬·à­à¬šà¬°",
        question: "à¬ªà­‹à¬·à­à¬šà¬° à¬¸à¬ à¬¿à¬• à¬•à¬²à­‡ à¬ªà­à¬£à¬¿à¬ªà­à¬£à¬¿ à¬¹à­‡à¬‰à¬¥à¬¿à¬¬à¬¾ à¬¬à­‡à¬¦à¬¨à¬¾ à¬•à¬®à¬¿à¬ªà¬¾à¬°à­‡ à¬•à¬¿?",
        answer:
          "à¬…à¬¨à­‡à¬• à¬®à¬¾à¬®à¬²à¬¾à¬°à­‡ à¬¹à¬à¥¤ à¬­à­à¬²à­ à¬­à¬¾à¬¬à¬°à­‡ à¬¬à¬¸à¬¿à¬¬à¬¾, à¬«à­‹à¬¨à­ à¬¬à­à­Ÿà¬¬à¬¹à¬¾à¬°, à¬•à¬¾à¬®à¬° à¬¸à­‡à¬Ÿà¬…à¬ªà­ à¬à¬¬à¬‚ à¬®à¬¾à¬‚à¬¸à¬ªà­‡à¬¶à­€à¬° à¬…à¬¸à¬¨à­à¬¤à­à¬³à¬¨ à¬¶à¬°à­€à¬°à¬°à­‡ à¬…à¬§à¬¿à¬• à¬šà¬¾à¬ª à¬¸à­ƒà¬·à­à¬Ÿà¬¿ à¬•à¬°à­‡à¥¤ à¬†à¬®à­‡ à¬°à­‹à¬—à­€à¬™à­à¬•à­ à¬¸à­‡à¬®à¬¾à¬¨à¬™à­à¬• à¬ªà­‹à¬·à­à¬šà¬° à¬…à¬­à­à­Ÿà¬¾à¬¸ à¬¬à­à¬à¬¾à¬‡ à¬¬à­à­Ÿà¬¬à¬¹à¬¾à¬°à¬¿à¬• à¬¬à­à­Ÿà¬¾à­Ÿà¬¾à¬® à¬¦à­‡à¬‡à¬¥à¬¾à¬‰à¥¤",
        keywords: ["à¬ªà­‹à¬·à­à¬šà¬°", "à¬…à¬«à¬¿à¬¸", "à¬¡à­‡à¬¸à­à¬•", "à¬ªà­à¬£à¬¿à¬ªà­à¬£à¬¿ à¬¬à­‡à¬¦à¬¨à¬¾", "à¬à¬°à­à¬—à­‹à¬¨à­‹à¬®à¬¿à¬•à­à¬¸"],
      },
      {
        category: "à¬šà¬¿à¬•à¬¿à¬¤à­à¬¸à¬¾",
        question: "à¬®à­‹à¬¤à­‡ à¬•à­‡à¬¤à­‡à¬Ÿà¬¿ à¬¸à­‡à¬¸à¬¨à­ à¬¦à¬°à¬•à¬¾à¬° à¬¹à­‡à¬¬?",
        answer:
          "à¬à¬¹à¬¾ à¬†à¬ªà¬£à¬™à­à¬• à¬¸à¬®à¬¸à­à­Ÿà¬¾, à¬¬à­‡à¬¦à¬¨à¬¾à¬° à¬…à¬¬à¬§à¬¿, à¬¶à¬•à­à¬¤à¬¿, à¬®à­à¬­à¬®à­‡à¬£à­à¬Ÿ à¬à¬¬à¬‚ à¬¸à­à¬¸à­à¬¥à¬¤à¬¾ à¬²à¬•à­à¬·à­à­Ÿ à¬‰à¬ªà¬°à­‡ à¬¨à¬¿à¬°à­à¬­à¬° à¬•à¬°à­‡à¥¤ à¬šà­‡à¬•à¬…à¬ªà­ à¬ªà¬°à­‡ à¬•à­à¬²à¬¿à¬¨à¬¿à¬• à¬Ÿà¬¿à¬®à­ à¬†à¬ªà¬£à¬™à­à¬• à¬ªà¬¾à¬‡à¬ à¬¬à­à­Ÿà¬¬à¬¹à¬¾à¬°à¬¿à¬• à¬Ÿà­à¬°à¬¿à¬Ÿà¬®à­‡à¬£à­à¬Ÿ à¬•à¬¿à¬®à­à¬¬à¬¾ à¬¸à­‡à¬¸à¬¨à­ à¬ªà­à¬²à¬¾à¬¨à­ à¬¦à­‡à¬¬à­‡à¥¤",
        keywords: ["à¬¸à­‡à¬¸à¬¨à­", "à¬Ÿà­à¬°à¬¿à¬Ÿà¬®à­‡à¬£à­à¬Ÿ à¬ªà­à¬²à¬¾à¬¨à­", "à¬•à­‡à¬¤à­‡", "à¬…à¬¬à¬§à¬¿"],
      },
      {
        category: "à¬…à¬ªà¬à¬£à­à¬Ÿà¬®à­‡à¬£à­à¬Ÿ",
        question: "à¬®à­à¬ à¬…à¬ªà¬à¬£à­à¬Ÿà¬®à­‡à¬£à­à¬Ÿ à¬•à¬¿à¬ªà¬°à¬¿ à¬¬à­à¬•à­ à¬•à¬°à¬¿à¬¬à¬¿?",
        answer:
          "à¬°à­‹à¬—à­€ à¬†à¬•à¬¾à¬‰à¬£à­à¬Ÿ à¬¤à¬¿à¬†à¬°à¬¿ à¬•à¬°à¬¨à­à¬¤à­, à¬²à¬—à¬‡à¬¨à­ à¬•à¬°à¬¨à­à¬¤à­ à¬à¬¬à¬‚ à¬¨à¬¿à¬œ à¬¡à¬¾à¬¶à¬¬à­‹à¬°à­à¬¡à¬°à­ à¬…à¬ªà¬à¬£à­à¬Ÿà¬®à­‡à¬£à­à¬Ÿ à¬…à¬¨à­à¬°à­‹à¬§ à¬ªà¬ à¬¾à¬¨à­à¬¤à­à¥¤ à¬•à­à¬²à¬¿à¬¨à¬¿à¬• à¬Ÿà¬¿à¬®à­ à¬à¬¹à¬¾à¬•à­ à¬…à¬¨à­à¬®à­‹à¬¦à¬¨ à¬•à¬¿à¬®à­à¬¬à¬¾ à¬ªà­à¬¨à¬ƒà¬¸à¬®à­Ÿ à¬¨à¬¿à¬°à­à¬¦à­à¬§à¬¾à¬°à¬£ à¬•à¬°à¬¿à¬ªà¬¾à¬°à¬¿à¬¬, à¬à¬¬à¬‚ à¬…à¬ªà¬¡à­‡à¬Ÿà­ à¬†à¬ªà¬£à¬™à­à¬• à­±à­‡à¬¬ à¬“ à¬®à­‹à¬¬à¬¾à¬‡à¬² à¬†à¬•à¬¾à¬‰à¬£à­à¬Ÿà¬°à­‡ à¬¦à­‡à¬–à¬¿à¬¬à­‡à¥¤",
        keywords: ["à¬…à¬ªà¬à¬£à­à¬Ÿà¬®à­‡à¬£à­à¬Ÿ", "à¬¬à­à¬•à­", "à¬°à¬¿à¬¶à­‡à¬¡à­à¬¯à­à¬²à­", "à¬…à¬¨à­à¬®à­‹à¬¦à¬¨", "à¬²à¬—à¬‡à¬¨à­"],
      },
      {
        category: "à¬•à­à¬²à¬¿à¬¨à¬¿à¬•à¬¾à¬² à¬¨à­‹à¬Ÿà­à¬¸",
        question: "à¬ªà­à¬°à­à¬£à¬¾ à¬¡à¬¾à¬•à­à¬¤à¬° à¬¨à­‹à¬Ÿà­à¬¸ à¬•à¬¿à¬®à­à¬¬à¬¾ à¬°à¬¿à¬ªà­‹à¬°à­à¬Ÿ à¬¶à­‡à­Ÿà¬° à¬•à¬°à¬¿à¬ªà¬¾à¬°à¬¿à¬¬à¬¿ à¬•à¬¿?",
        answer:
          "à¬¹à¬à¥¤ à¬²à¬—à¬‡à¬¨à­ à¬ªà¬°à­‡ à¬†à¬ªà¬£ à¬¡à¬¾à¬¶à¬¬à­‹à¬°à­à¬¡à¬°à­ à¬•à­à¬²à¬¿à¬¨à¬¿à¬•à¬¾à¬² à¬¨à­‹à¬Ÿà­à¬¸ à¬¯à­‹à¬¡à¬¼à¬¿à¬ªà¬¾à¬°à¬¿à¬¬à­‡ à¬à¬¬à¬‚ PDF à¬•à¬¿à¬®à­à¬¬à¬¾ à¬›à¬¬à¬¿ à¬…à¬ªà¬²à­‹à¬¡à­ à¬•à¬°à¬¿à¬ªà¬¾à¬°à¬¿à¬¬à­‡à¥¤ à¬à¬¹à¬¿ à¬¡à¬•à­à­Ÿà­à¬®à­‡à¬£à­à¬Ÿ à¬•à­à¬²à¬¿à¬¨à¬¿à¬•à¬•à­ à¬†à¬ªà¬£à¬™à­à¬• à¬ªà­‚à¬°à­à¬¬ à¬‡à¬¤à¬¿à¬¹à¬¾à¬¸ à¬¬à­à¬à¬¿ à¬¸à¬ à¬¿à¬• à¬šà¬¿à¬•à¬¿à¬¤à­à¬¸à¬¾ à¬ªà­à¬²à¬¾à¬¨à­ à¬•à¬°à¬¿à¬¬à¬¾à¬°à­‡ à¬¸à¬¹à¬¾à­Ÿà¬¤à¬¾ à¬•à¬°à­‡à¥¤",
        keywords: ["à¬•à­à¬²à¬¿à¬¨à¬¿à¬•à¬¾à¬² à¬¨à­‹à¬Ÿà­à¬¸", "à¬°à¬¿à¬ªà­‹à¬°à­à¬Ÿ", "PDF", "à¬›à¬¬à¬¿", "à¬¡à¬¾à¬•à­à¬¤à¬° à¬¨à­‹à¬Ÿà­à¬¸"],
      },
      {
        category: "à¬¸à¬¹à¬¾à­Ÿà¬¤à¬¾",
        question: "à¬®à­‹à¬¤à­‡ à¬•à­‹à¬£à¬¸à¬¿ à¬¸à­‡à¬¬à¬¾ à¬¦à¬°à¬•à¬¾à¬° à¬¤à¬¾à¬¹à¬¾ à¬¨à¬¿à¬¶à­à¬šà¬¿à¬¤ à¬¨à¬¹à­‡à¬²à­‡ à¬•à¬£ à¬•à¬°à¬¿à¬¬à¬¿?",
        answer:
          "à¬¯à¬¦à¬¿ à¬•à­Œà¬£à¬¸à¬¿ à¬·à­à¬Ÿà¬¾à¬«à­ à¬…à¬¨à¬²à¬¾à¬‡à¬¨à­ à¬…à¬›à¬¨à­à¬¤à¬¿, à¬¤à­‡à¬¬à­‡ Live Chat à¬¬à­à­Ÿà¬¬à¬¹à¬¾à¬° à¬•à¬°à¬¨à­à¬¤à­, à¬•à¬¿à¬®à­à¬¬à¬¾ Contact form à¬°à­ à¬®à­‡à¬¸à­‡à¬œà­ à¬ªà¬ à¬¾à¬¨à­à¬¤à­à¥¤ à¬¨à¬¿à¬œ à¬¬à­‡à¬¦à¬¨à¬¾, à¬¸à¬®à­Ÿ à¬…à¬¬à¬§à¬¿ à¬à¬¬à¬‚ à¬ªà­‚à¬°à­à¬¬ à¬šà¬¿à¬•à¬¿à¬¤à­à¬¸à¬¾ à¬¬à¬¿à¬·à­Ÿà¬°à­‡ à¬¸à¬‚à¬•à­à¬·à¬¿à¬ªà­à¬¤à¬°à­‡ à¬²à­‡à¬–à¬¨à­à¬¤à­, à¬¯à¬¾à¬¹à¬¾à¬¦à­à­±à¬¾à¬°à¬¾ à¬Ÿà¬¿à¬®à­ à¬ à¬¿à¬• à¬ªà¬°à¬¬à¬°à­à¬¤à­à¬¤à­€ à¬ªà¬¦à¬•à­à¬·à­‡à¬ª à¬¦à­‡à¬–à¬¾à¬‡à¬ªà¬¾à¬°à¬¿à¬¬à¥¤",
        keywords: ["à¬¸à¬¹à¬¾à­Ÿà¬¤à¬¾", "à¬•à­‹à¬£à¬¸à¬¿ à¬¸à­‡à¬¬à¬¾", "à¬²à¬¾à¬‡à¬­à­ à¬šà¬¾à¬Ÿà­", "à¬¯à­‹à¬—à¬¾à¬¯à­‹à¬—", "à¬®à¬¾à¬°à­à¬—à¬¦à¬°à­à¬¶à¬¨"],
      },
    ],
  },
};

export default function FaqPage() {
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState("");
  const t = copy[language] || copy.en;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) {
      return t.faqItems;
    }

    return t.faqItems.filter((item) =>
      [item.category, item.question, item.answer, ...item.keywords]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [normalizedQuery, t]);

  return (
    <PublicLayout>
      <Seo
        title="FAQ and Patient Help | Omm Physio World"
        description="Find physiotherapy FAQ answers about pain relief, posture correction, rehabilitation, clinical notes, appointments, and how Omm Physio World can help."
        path="/faq"
      />

      <section className="page-section relative px-4 py-12 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="rounded-[36px] border border-slate-200 bg-white/90 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                <Sparkles size={16} />
                {t.badge}
              </div>
              <h1 className="mt-5 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
                {t.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                {t.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">
                  {filteredItems.length} {t.answersAvailable}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {t.guidanceLabel}
                </span>
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <Search size={20} className="text-sky-600" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {t.categoryCards.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setQuery(item)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[36px] bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-800 p-6 text-white shadow-2xl shadow-sky-900/20">
              <p className="text-sm uppercase tracking-[0.22em] text-white/55">
                {t.helpTitle}
              </p>
              <div className="mt-5 space-y-4">
                {t.helpItems.map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl bg-white/10 p-4">
                    <HelpCircle className="mt-0.5 shrink-0 text-sky-200" size={18} />
                    <p className="text-sm leading-6 text-white/82">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-[26px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                  {t.quickTip}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/82">
                  {t.quickTipText}
                </p>
              </div>
              <Link
                to="/contact"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100"
              >
                {t.contactClinic}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            {filteredItems.length ? (
              filteredItems.map((item) => (
                <article
                  key={item.question}
                  className={`rounded-[30px] border bg-white/90 shadow-sm backdrop-blur transition ${
                    expandedQuestion === item.question
                      ? "border-sky-200 shadow-[0_18px_40px_rgba(14,165,233,0.12)]"
                      : "border-slate-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedQuestion((current) =>
                        current === item.question ? "" : item.question
                      )
                    }
                    className="flex w-full flex-col gap-3 p-5 text-left sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                        {item.category}
                      </span>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {expandedQuestion === item.question ? t.tapToHide : t.tapToView}
                      </p>
                      <h2 className="mt-3 text-lg font-semibold text-slate-950 sm:text-xl">
                        {item.question}
                      </h2>
                    </div>
                    <ChevronDown
                      className={`shrink-0 text-slate-400 transition-transform ${
                        expandedQuestion === item.question ? "rotate-180 text-sky-600" : ""
                      }`}
                    />
                  </button>
                  {expandedQuestion === item.question && (
                    <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-sm leading-7 text-slate-600">{item.answer}</p>
                      </div>
                    </div>
                  )}
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center">
                <h2 className="text-xl font-semibold text-slate-950">
                  {t.noMatchTitle}
                </h2>
                <p className="mt-2 text-sm text-slate-500">{t.noMatchText}</p>
                <Link
                  to="/contact"
                  className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  {t.contactUs}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

