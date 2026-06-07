import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, HelpCircle, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import PublicLayout from "../layout/PublicLayout";
import { createBreadcrumbSchema, createFaqSchema, createMedicalBusinessSchema } from "../utils/seo";

const faqItems = [
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
    category: "Pain Relief",
    question: "Can physiotherapy help with knee pain?",
    answer:
      "Physiotherapy may help knee pain by improving strength, flexibility, joint control, walking pattern, and load management. The cause of pain should be assessed first.",
    keywords: ["knee pain", "joint pain", "walking", "strength"],
  },
  {
    category: "Pain Relief",
    question: "Can physiotherapy help with heel pain?",
    answer:
      "Heel pain can come from plantar fascia irritation, footwear stress, calf tightness, or load changes. Physiotherapy can guide stretching, strengthening, taping, footwear advice, and activity modification.",
    keywords: ["heel pain", "plantar", "foot pain", "calf"],
  },
  {
    category: "Pain Relief",
    question: "Can physiotherapy help with sciatica symptoms?",
    answer:
      "Physiotherapy may help sciatica-like symptoms by assessing nerve irritation, back mobility, hip movement, posture, and strength. Severe weakness, numbness, or bladder symptoms need urgent medical care.",
    keywords: ["sciatica", "leg pain", "nerve pain", "back"],
  },
  {
    category: "Pain Relief",
    question: "Can physiotherapy help with frozen shoulder?",
    answer:
      "Frozen shoulder often needs gradual mobility work, pain control, and progressive strengthening. Treatment pace depends on the stage and pain tolerance.",
    keywords: ["frozen shoulder", "shoulder stiffness", "mobility"],
  },
  {
    category: "Pain Relief",
    question: "Why does my pain keep coming back?",
    answer:
      "Recurring pain can be related to weakness, posture habits, repetitive loading, incomplete rehab, stress, sleep, or work setup. A physiotherapy assessment helps identify likely triggers.",
    keywords: ["recurring pain", "again", "repeat", "trigger"],
  },
  {
    category: "Pain Relief",
    question: "Is pain always caused by a serious problem?",
    answer:
      "Not always. Pain can come from muscle strain, joint stiffness, overload, or poor recovery. However, severe, spreading, traumatic, or unusual symptoms should be checked medically.",
    keywords: ["serious pain", "danger", "medical"],
  },
  {
    category: "Pain Relief",
    question: "Should I rest completely when I have pain?",
    answer:
      "Complete rest is not always best. Many conditions improve with safe movement, reduced aggravating load, and gradual exercise. The right balance depends on your symptoms.",
    keywords: ["rest", "movement", "pain"],
  },
  {
    category: "Pain Relief",
    question: "Can physiotherapy reduce muscle tightness?",
    answer:
      "Yes. Treatment may include mobility work, manual therapy, stretching, strengthening, breathing, posture changes, and home exercises to reduce repeated tightness.",
    keywords: ["tightness", "muscle", "stretch"],
  },
  {
    category: "Pain Relief",
    question: "Can physiotherapy help with wrist pain?",
    answer:
      "Wrist pain may be related to strain, repetitive work, grip weakness, nerve irritation, or joint stiffness. Physiotherapy can guide safe exercises and ergonomic changes.",
    keywords: ["wrist", "hand pain", "grip"],
  },
  {
    category: "Pain Relief",
    question: "Can physiotherapy help with ankle pain?",
    answer:
      "Ankle pain after sprain or overload often needs mobility, balance, calf strength, and return-to-walking guidance. Assessment helps decide the right progression.",
    keywords: ["ankle", "sprain", "balance"],
  },
  {
    category: "Pain Relief",
    question: "Can physiotherapy help with elbow pain?",
    answer:
      "Elbow pain can come from repetitive gripping, lifting, sports, or tendon irritation. Physiotherapy can work on load control, forearm strength, shoulder support, and activity changes.",
    keywords: ["elbow", "tennis elbow", "grip"],
  },
  {
    category: "Pain Relief",
    question: "What should I do if exercise increases pain?",
    answer:
      "Stop that exercise for now and tell the clinic team. The movement may need a lower intensity, smaller range, slower pace, or a different exercise.",
    keywords: ["exercise pain", "worse", "home exercise"],
  },
  {
    category: "Pain Relief",
    question: "How soon can pain reduce after physiotherapy?",
    answer:
      "Some patients feel improvement quickly, while others need several sessions. Recovery depends on pain duration, diagnosis, lifestyle, consistency, and tissue healing.",
    keywords: ["pain reduce", "how soon", "recovery time"],
  },
  {
    category: "Posture",
    question: "Can posture correction reduce recurring pain?",
    answer:
      "In many cases, yes. Poor sitting, phone use, work setup, and muscle imbalance can increase strain. We help patients understand their posture habits and follow practical correction exercises.",
    keywords: ["posture", "office", "desk", "recurring pain", "ergonomics"],
  },
  {
    category: "Posture",
    question: "Can long mobile phone use cause neck pain?",
    answer:
      "Long phone use can increase neck and shoulder load, especially with the head bent forward. Breaks, screen height, and strengthening can help.",
    keywords: ["mobile", "phone neck", "text neck"],
  },
  {
    category: "Posture",
    question: "How can I improve sitting posture at work?",
    answer:
      "Keep feet supported, screen near eye level, shoulders relaxed, and take short movement breaks. Physiotherapy can personalize posture and mobility exercises.",
    keywords: ["sitting", "office", "desk", "ergonomics"],
  },
  {
    category: "Posture",
    question: "Is a straight back always the best posture?",
    answer:
      "The best posture is often one you can change comfortably. Staying in one position too long can cause strain even if it looks correct.",
    keywords: ["straight back", "best posture"],
  },
  {
    category: "Posture",
    question: "Can poor posture affect breathing?",
    answer:
      "Rounded shoulders and stiff upper back can sometimes limit comfortable chest movement. Mobility, breathing awareness, and strengthening may help.",
    keywords: ["breathing", "posture", "upper back"],
  },
  {
    category: "Posture",
    question: "Can physiotherapy help students with study posture?",
    answer:
      "Yes. Students can learn desk setup, break routines, neck and back exercises, and habits to reduce strain during long study hours.",
    keywords: ["student", "study", "posture"],
  },
  {
    category: "Posture",
    question: "Can posture issues cause headaches?",
    answer:
      "Some headaches are linked with neck stiffness, muscle tension, and posture strain. A physiotherapist can screen contributing factors and suggest safe care.",
    keywords: ["headache", "neck", "posture"],
  },
  {
    category: "Posture",
    question: "Do I need special equipment for posture correction?",
    answer:
      "Usually not at first. Many posture plans use simple home exercises, movement breaks, and setup changes. Equipment is suggested only when useful.",
    keywords: ["equipment", "posture correction"],
  },
  {
    category: "Posture",
    question: "Can posture improve without pain treatment?",
    answer:
      "Sometimes posture awareness and strengthening are enough. If pain, stiffness, or weakness is present, treatment may be added.",
    keywords: ["posture improve", "without pain"],
  },
  {
    category: "Posture",
    question: "How long does posture correction take?",
    answer:
      "Posture change is gradual. It depends on habits, strength, flexibility, work demands, and how regularly exercises are followed.",
    keywords: ["posture time", "how long"],
  },
  {
    category: "Rehab",
    question: "Do you support post-injury rehabilitation?",
    answer:
      "Yes. Omm Physio World supports guided rehabilitation after sprain, strain, sports injury, weakness, or mobility restriction. Rehab usually includes pain control, movement retraining, strengthening, and gradual return to activity.",
    keywords: ["injury", "rehab", "sports", "sprain", "weakness"],
  },
  {
    category: "Rehab",
    question: "What is rehabilitation in physiotherapy?",
    answer:
      "Rehabilitation is a structured plan to restore movement, strength, balance, confidence, and daily function after pain, injury, surgery, or illness.",
    keywords: ["rehab", "rehabilitation", "recovery"],
  },
  {
    category: "Rehab",
    question: "Can physiotherapy help after surgery?",
    answer:
      "Post-surgery physiotherapy can support mobility, swelling control, strength, walking, and safe return to activity. The plan should follow surgeon guidance.",
    keywords: ["post surgery", "after surgery", "operation"],
  },
  {
    category: "Rehab",
    question: "Can physiotherapy help after fracture healing?",
    answer:
      "After medical clearance, physiotherapy can help restore joint movement, muscle strength, balance, and functional use after immobilization.",
    keywords: ["fracture", "cast", "bone", "healing"],
  },
  {
    category: "Rehab",
    question: "Can physiotherapy improve walking confidence?",
    answer:
      "Yes. Walking confidence can improve with strength, balance, gait training, mobility work, and safe practice based on the patient's condition.",
    keywords: ["walking", "gait", "confidence"],
  },
  {
    category: "Rehab",
    question: "What is balance training?",
    answer:
      "Balance training uses safe exercises to improve stability, body control, and fall confidence. It can be useful after injury, weakness, or neurological issues.",
    keywords: ["balance", "fall", "stability"],
  },
  {
    category: "Rehab",
    question: "Can elderly patients do physiotherapy?",
    answer:
      "Yes. Physiotherapy can be adapted for older adults with safe exercises for mobility, balance, pain, strength, and daily activity support.",
    keywords: ["elderly", "senior", "old age"],
  },
  {
    category: "Rehab",
    question: "Can physiotherapy help with weakness?",
    answer:
      "Physiotherapy can help build strength safely when weakness is due to inactivity, injury, pain, or recovery. Sudden weakness needs medical evaluation.",
    keywords: ["weakness", "strength", "muscle"],
  },
  {
    category: "Rehab",
    question: "What should I bring for a rehab visit?",
    answer:
      "Bring previous reports, prescriptions, imaging notes if available, comfortable clothing, and details about pain, limitations, and goals.",
    keywords: ["bring", "reports", "rehab visit"],
  },
  {
    category: "Rehab",
    question: "Can physiotherapy help after stroke?",
    answer:
      "Neurological physiotherapy may help with movement, balance, walking, and functional practice after stroke. Care should be coordinated with medical advice.",
    keywords: ["stroke", "neuro", "paralysis"],
  },
  {
    category: "Rehab",
    question: "Can physiotherapy help with joint stiffness?",
    answer:
      "Yes. Joint stiffness can improve with mobility exercises, manual techniques, strengthening, and consistent home practice when appropriate.",
    keywords: ["joint stiffness", "mobility"],
  },
  {
    category: "Rehab",
    question: "Can physiotherapy help after long bed rest?",
    answer:
      "After illness or bed rest, physiotherapy can help rebuild strength, endurance, balance, and confidence in daily activities.",
    keywords: ["bed rest", "deconditioning", "weakness"],
  },
  {
    category: "Rehab",
    question: "Can physiotherapy help with arthritis?",
    answer:
      "Physiotherapy can support arthritis management with joint-friendly movement, strengthening, flexibility, pacing, and pain reduction strategies.",
    keywords: ["arthritis", "joint pain", "osteoarthritis"],
  },
  {
    category: "Rehab",
    question: "Can physiotherapy help after ligament injury?",
    answer:
      "Yes. Ligament rehab often focuses on swelling control, mobility, strength, balance, and gradual return to sport or daily activity.",
    keywords: ["ligament", "ACL", "sprain"],
  },
  {
    category: "Rehab",
    question: "How do I know rehab is progressing?",
    answer:
      "Progress may show as less pain, better movement, improved strength, easier walking, better sleep, or more confidence in daily tasks.",
    keywords: ["progress", "rehab improvement"],
  },
  {
    category: "Sports Injury",
    question: "Can physiotherapy help sports injuries?",
    answer:
      "Yes. Sports rehab can include pain control, mobility, strength, balance, technique correction, and gradual return-to-play planning.",
    keywords: ["sports", "injury", "athlete"],
  },
  {
    category: "Sports Injury",
    question: "When can I return to sports after injury?",
    answer:
      "Return depends on pain, strength, movement quality, balance, sport demands, and healing stage. A graded return is safer than rushing.",
    keywords: ["return to sport", "play again"],
  },
  {
    category: "Sports Injury",
    question: "Can physiotherapy help prevent repeat injuries?",
    answer:
      "It can reduce risk by improving strength, mobility, balance, warm-up habits, training load, and movement control.",
    keywords: ["prevent injury", "repeat injury"],
  },
  {
    category: "Sports Injury",
    question: "Do sports injuries always need rest?",
    answer:
      "Some rest may be needed, but guided movement and progressive loading are often important. The right plan depends on injury type and severity.",
    keywords: ["sports rest", "training load"],
  },
  {
    category: "Sports Injury",
    question: "Can physiotherapy help runners?",
    answer:
      "Yes. Runners may benefit from strength work, mobility, load planning, gait advice, footwear review, and return-to-run progression.",
    keywords: ["runner", "running", "gait"],
  },
  {
    category: "Sports Injury",
    question: "Can physiotherapy help gym-related pain?",
    answer:
      "Gym pain may come from overload, technique, mobility limits, or inadequate recovery. Physiotherapy can guide safer exercise modification.",
    keywords: ["gym", "lifting", "workout"],
  },
  {
    category: "Sports Injury",
    question: "What is warm-up guidance?",
    answer:
      "Warm-up guidance includes movements that prepare joints, muscles, and nervous system for activity. It should match your sport or workout.",
    keywords: ["warm up", "exercise prep"],
  },
  {
    category: "Sports Injury",
    question: "Can physiotherapy help with muscle strain?",
    answer:
      "Yes. Muscle strain rehab may include pain control, gentle mobility, progressive strengthening, and gradual return to activity.",
    keywords: ["muscle strain", "pull", "tear"],
  },
  {
    category: "Neurological Support",
    question: "Do you provide neurological physiotherapy support?",
    answer:
      "The clinic can support selected neurological recovery needs such as balance, walking, mobility, and functional exercise, depending on assessment and medical guidance.",
    keywords: ["neuro", "neurological", "balance"],
  },
  {
    category: "Neurological Support",
    question: "Can physiotherapy help with balance problems?",
    answer:
      "Balance problems can improve with targeted exercises, strength work, walking practice, and safety education. Medical review may be needed for dizziness or sudden symptoms.",
    keywords: ["balance", "dizziness", "fall"],
  },
  {
    category: "Neurological Support",
    question: "Can physiotherapy help with Parkinson's movement issues?",
    answer:
      "Physiotherapy may support posture, walking, balance, flexibility, and functional movement for Parkinson's patients alongside medical care.",
    keywords: ["parkinson", "movement", "neuro"],
  },
  {
    category: "Neurological Support",
    question: "Can physiotherapy help foot drop?",
    answer:
      "Foot drop needs assessment to understand nerve and muscle function. Physiotherapy may include strengthening, gait training, safety advice, and referral guidance.",
    keywords: ["foot drop", "walking", "nerve"],
  },
  {
    category: "Neurological Support",
    question: "Can physiotherapy help after nerve injury?",
    answer:
      "Depending on the condition, physiotherapy can support mobility, strength, sensitivity, and function after nerve injury. Medical diagnosis is important.",
    keywords: ["nerve injury", "neuro", "sensation"],
  },
  {
    category: "Neurological Support",
    question: "Can physiotherapy help with tremor?",
    answer:
      "Physiotherapy may help with functional strategies, posture, coordination, and confidence. Tremor causes should be medically assessed.",
    keywords: ["tremor", "coordination"],
  },
  {
    category: "Neurological Support",
    question: "Can physiotherapy help with coordination problems?",
    answer:
      "Coordination exercises, balance practice, and task training may help depending on the cause and severity.",
    keywords: ["coordination", "neuro"],
  },
  {
    category: "Neurological Support",
    question: "Do neurological patients need caregiver support?",
    answer:
      "Some patients benefit from caregiver involvement for safety, home exercise support, walking practice, and daily routine guidance.",
    keywords: ["caregiver", "neuro support"],
  },
  {
    category: "Treatment",
    question: "How many sessions will I need?",
    answer:
      "It depends on the condition, pain duration, strength, mobility, and recovery goal. After assessment, the clinic team can suggest a practical treatment/session plan.",
    keywords: ["session", "treatment plan", "how many", "duration"],
  },
  {
    category: "Treatment",
    question: "What happens in the first physiotherapy visit?",
    answer:
      "The team usually asks about symptoms, history, daily activity, previous reports, and goals. They may assess movement, strength, posture, and pain response before suggesting a plan.",
    keywords: ["first visit", "assessment", "consultation"],
  },
  {
    category: "Treatment",
    question: "Is physiotherapy painful?",
    answer:
      "Treatment should be tolerable and guided. Some exercises may feel challenging, but sharp or worsening pain should be reported immediately.",
    keywords: ["painful", "treatment pain"],
  },
  {
    category: "Treatment",
    question: "Do I need a doctor's prescription for physiotherapy?",
    answer:
      "A prescription can be helpful, especially after surgery or for medical conditions. You can also contact the clinic for guidance on whether assessment is appropriate.",
    keywords: ["doctor prescription", "referral"],
  },
  {
    category: "Treatment",
    question: "What clothes should I wear for physiotherapy?",
    answer:
      "Wear comfortable clothing that allows safe movement and access to the affected area, such as loose pants, t-shirt, or sportswear.",
    keywords: ["clothes", "wear", "visit"],
  },
  {
    category: "Treatment",
    question: "Can I continue exercises at home?",
    answer:
      "Yes, if the clinic gives home exercises. Doing them correctly and consistently is often important for recovery.",
    keywords: ["home exercise", "continue"],
  },
  {
    category: "Treatment",
    question: "What if I miss a treatment session?",
    answer:
      "Contact the clinic as early as possible. The team can guide whether the session should be rescheduled and how to continue exercises safely.",
    keywords: ["miss session", "reschedule"],
  },
  {
    category: "Treatment",
    question: "Can treatment dates be extended?",
    answer:
      "If your recovery plan needs more time, the clinic team can extend active session dates from the admin side and continue tracking daily session status.",
    keywords: ["extend", "treatment date", "session date"],
  },
  {
    category: "Treatment",
    question: "Can previous session status be corrected?",
    answer:
      "Yes. If a previous session was not marked correctly, the clinic team can update past session status from not done to done, or back if needed.",
    keywords: ["session status", "done", "not done"],
  },
  {
    category: "Treatment",
    question: "How are treatment sessions tracked?",
    answer:
      "Treatment sessions can be tracked daily with done or not done status. Patients can see updates in their app when the clinic updates records.",
    keywords: ["track session", "daily status"],
  },
  {
    category: "Treatment",
    question: "Can one patient have multiple treatment types?",
    answer:
      "Yes. A treatment session can include multiple care items such as pain relief, mobility, posture, strengthening, or rehab depending on the plan.",
    keywords: ["multiple treatment", "types"],
  },
  {
    category: "Treatment",
    question: "What is a treatment plan?",
    answer:
      "A treatment plan is a structured record of treatment types, dates, assigned staff, payment details, and daily session progress.",
    keywords: ["treatment plan", "record"],
  },
  {
    category: "Treatment",
    question: "Can treatment be at home?",
    answer:
      "Home service may be available after OPW confirms suitability. First-time patients and every post-session review should visit the clinic.",
    keywords: ["home service", "at home", "clinic"],
  },
  {
    category: "Treatment",
    question: "Why do first-time patients need to visit the clinic?",
    answer:
      "A first clinic visit helps the team assess the condition, review safety, understand goals, and decide whether clinic or home service is suitable.",
    keywords: ["first time", "clinic visit"],
  },
  {
    category: "Treatment",
    question: "Can I stop treatment early?",
    answer:
      "Discuss with the clinic before stopping. The team can explain risks, modify the plan, or suggest a safe home program.",
    keywords: ["stop treatment", "early"],
  },
  {
    category: "Appointments",
    question: "How do I book an appointment?",
    answer:
      "Create a patient account, login, and request an appointment from your dashboard. The clinic team can approve or reschedule it, and the update will be visible in your web and mobile account.",
    keywords: ["appointment", "book", "reschedule", "approve", "login"],
  },
  {
    category: "Appointments",
    question: "Can I request an appointment from the website?",
    answer:
      "Yes. Use the booking page or patient dashboard to request an appointment. The clinic team will review and confirm or reschedule.",
    keywords: ["website appointment", "booking page"],
  },
  {
    category: "Appointments",
    question: "Can I request an appointment from the mobile app?",
    answer:
      "Yes. Login to the patient app and use the appointment screen to request a service, date, time, and clinic or home preference.",
    keywords: ["app appointment", "mobile app"],
  },
  {
    category: "Appointments",
    question: "Why is my appointment request pending?",
    answer:
      "Pending means the clinic has not yet approved, rescheduled, or cancelled the request. You will receive an update after review.",
    keywords: ["pending appointment", "request"],
  },
  {
    category: "Appointments",
    question: "Can I cancel an appointment request?",
    answer:
      "If cancellation is available in your account, use it there. Otherwise contact the clinic and mention your name, mobile number, and requested date.",
    keywords: ["cancel appointment", "cancel request"],
  },
  {
    category: "Appointments",
    question: "Can the clinic reschedule my appointment?",
    answer:
      "Yes. The clinic can reschedule based on availability. The new date and time will show in your account and may be sent by notification.",
    keywords: ["reschedule", "new time"],
  },
  {
    category: "Appointments",
    question: "Can I choose clinic or home service while booking?",
    answer:
      "Yes. Appointment requests can include service location preference. Home service is subject to suitability and clinic confirmation.",
    keywords: ["clinic", "home", "location"],
  },
  {
    category: "Appointments",
    question: "Why can I not create another appointment request?",
    answer:
      "If you already have an active pending or scheduled request, the form may stay hidden until that request is cancelled or completed.",
    keywords: ["another request", "form hidden"],
  },
  {
    category: "Appointments",
    question: "Will I get appointment notifications?",
    answer:
      "If notifications are enabled in the app, you may receive updates for approval, reschedule, cancellation, reminders, and completion.",
    keywords: ["notification", "appointment update"],
  },
  {
    category: "Appointments",
    question: "What should I mention in appointment message?",
    answer:
      "Mention your pain area, duration, preferred service, available time, and whether you have reports or previous treatment history.",
    keywords: ["appointment message", "details"],
  },
  {
    category: "Appointments",
    question: "What if I arrive late?",
    answer:
      "Please contact the clinic as soon as possible. Availability depends on the schedule for that day.",
    keywords: ["late", "appointment"],
  },
  {
    category: "Appointments",
    question: "Can I book for a family member?",
    answer:
      "You can contact the clinic for guidance. The patient details should match the person receiving care.",
    keywords: ["family", "book for someone"],
  },
  {
    category: "Clinical Notes",
    question: "Can I share previous doctor notes or reports?",
    answer:
      "Yes. After login, you can add clinical notes and upload PDF or image documents from your dashboard. These documents help the clinic understand your history before planning care.",
    keywords: ["clinical notes", "report", "pdf", "image", "doctor notes"],
  },
  {
    category: "Clinical Notes",
    question: "Can I upload X-ray or MRI reports?",
    answer:
      "Yes, if the upload option is available in your patient dashboard. Reports can help the clinic understand your case better.",
    keywords: ["xray", "mri", "report upload"],
  },
  {
    category: "Clinical Notes",
    question: "Can the clinic add notes to my profile?",
    answer:
      "Yes. OPW staff can add clinical notes and treatment updates to your patient profile for care continuity.",
    keywords: ["clinic notes", "profile notes"],
  },
  {
    category: "Clinical Notes",
    question: "Can I delete uploaded clinical documents?",
    answer:
      "If deletion is available in your dashboard, you can remove uploads. For help, contact the clinic.",
    keywords: ["delete document", "remove report"],
  },
  {
    category: "Clinical Notes",
    question: "Are clinical notes private?",
    answer:
      "Clinical notes are part of patient care records and should be treated as private. Do not share login details with others.",
    keywords: ["private", "clinical notes", "privacy"],
  },
  {
    category: "Clinical Notes",
    question: "What file types can I upload?",
    answer:
      "The system commonly supports images and PDF-style documents where enabled. If a file does not upload, contact the clinic.",
    keywords: ["file type", "pdf", "image"],
  },
  {
    category: "Clinical Notes",
    question: "Why should I upload old reports?",
    answer:
      "Old reports can show diagnosis, previous treatment, imaging findings, surgery history, or medical restrictions that may affect the physiotherapy plan.",
    keywords: ["old report", "history"],
  },
  {
    category: "Clinical Notes",
    question: "Can I add symptoms as a note?",
    answer:
      "Yes. You can write symptom details such as pain area, duration, triggers, and what improves or worsens the pain.",
    keywords: ["symptoms", "note"],
  },
  {
    category: "Clinical Notes",
    question: "Will staff read my uploaded reports before appointment?",
    answer:
      "The clinic may review available notes and reports as part of patient care, but urgent concerns should also be communicated directly.",
    keywords: ["staff read", "before appointment"],
  },
  {
    category: "Clinical Notes",
    question: "Can clinical notes be used for treatment planning?",
    answer:
      "Yes. Notes and reports help the team understand your condition and design safer, more relevant treatment guidance.",
    keywords: ["treatment planning", "notes"],
  },
  {
    category: "Therapy",
    question: "What are therapy files in the patient app?",
    answer:
      "Therapy files are resources shared by OPW, such as exercise guidance, images, PDFs, or videos where available.",
    keywords: ["therapy files", "resources"],
  },
  {
    category: "Therapy",
    question: "Can I view recommended therapy in the app?",
    answer:
      "Yes. Recommended therapy resources can appear in your patient app or dashboard when the clinic assigns them.",
    keywords: ["recommended therapy", "app"],
  },
  {
    category: "Therapy",
    question: "Can therapy files replace clinic sessions?",
    answer:
      "No. Therapy resources support your plan but should not replace assessment or clinic guidance when symptoms need supervision.",
    keywords: ["replace session", "therapy file"],
  },
  {
    category: "Therapy",
    question: "What if a therapy file does not open?",
    answer:
      "Check your internet connection and try again. If it still does not open, contact the clinic so the file can be checked.",
    keywords: ["file not open", "download"],
  },
  {
    category: "Therapy",
    question: "Can exercises be changed during treatment?",
    answer:
      "Yes. Exercises may be changed based on pain, progress, strength, and treatment goals.",
    keywords: ["exercise change", "therapy"],
  },
  {
    category: "Therapy",
    question: "Should I do therapy exercises every day?",
    answer:
      "Follow the frequency given by the clinic. Some exercises are daily, while strengthening may need rest days.",
    keywords: ["daily exercise", "frequency"],
  },
  {
    category: "Therapy",
    question: "Can I ask questions about therapy files?",
    answer:
      "Yes. Use contact or live chat when available, or ask during your next visit if an exercise or file is unclear.",
    keywords: ["question therapy", "live chat"],
  },
  {
    category: "Therapy",
    question: "Do therapy resources expire?",
    answer:
      "Resources may remain available in your account, but you should follow the latest guidance from the clinic if your condition changes.",
    keywords: ["expire", "therapy resource"],
  },
  {
    category: "Therapy",
    question: "Can I share therapy files with others?",
    answer:
      "Therapy guidance is meant for the assigned patient. Others should get their own assessment before following exercises.",
    keywords: ["share files", "others"],
  },
  {
    category: "Therapy",
    question: "Why did the clinic add therapy after my session?",
    answer:
      "The clinic may add therapy resources to support home practice, recovery tracking, and continuity between visits.",
    keywords: ["after session", "therapy added"],
  },
  {
    category: "Payments",
    question: "Can I see pending payment balance?",
    answer:
      "If payment tracking is enabled for your treatment, pending balance can appear in your patient dashboard or app.",
    keywords: ["payment", "balance", "pending"],
  },
  {
    category: "Payments",
    question: "Will I get payment reminder notifications?",
    answer:
      "If a treatment balance is pending and notifications are enabled, the clinic may send reminder notifications.",
    keywords: ["payment reminder", "notification"],
  },
  {
    category: "Payments",
    question: "How are treatment payments recorded?",
    answer:
      "OPW staff can record payments inside the treatment plan. Paid amount and balance can update automatically.",
    keywords: ["payment recorded", "treatment payment"],
  },
  {
    category: "Payments",
    question: "Can I pay advance amount?",
    answer:
      "Advance payments may be recorded by the clinic when collected. Ask the clinic about available payment methods.",
    keywords: ["advance", "payment"],
  },
  {
    category: "Payments",
    question: "Can I get payment details later?",
    answer:
      "Payment history linked with your profile may be available through the clinic records. Contact OPW for details.",
    keywords: ["payment history", "receipt"],
  },
  {
    category: "Payments",
    question: "Does the website take online payment?",
    answer:
      "Use only payment options officially provided by OPW. If online payment is not shown, contact the clinic directly.",
    keywords: ["online payment", "pay"],
  },
  {
    category: "Payments",
    question: "Who updates my paid amount?",
    answer:
      "Clinic staff update payment records after receiving payment. If anything looks wrong, contact the clinic.",
    keywords: ["paid amount", "staff update"],
  },
  {
    category: "Patient Account",
    question: "How do I create a patient account?",
    answer:
      "Use the website or app signup/login flow where available. Enter accurate name, mobile number, and email so the clinic can identify your profile.",
    keywords: ["account", "signup", "register"],
  },
  {
    category: "Patient Account",
    question: "Can I login from both website and app?",
    answer:
      "Yes, if your account is active and the same login method is supported, you can access your patient dashboard from web and mobile.",
    keywords: ["login", "website", "app"],
  },
  {
    category: "Patient Account",
    question: "What if I forgot my password?",
    answer:
      "Use the password recovery option if available, or contact the clinic for support with your registered mobile or email.",
    keywords: ["forgot password", "reset"],
  },
  {
    category: "Patient Account",
    question: "Can I change my name or mobile number?",
    answer:
      "Contact the clinic if important profile details need correction. Accurate details help avoid duplicate records.",
    keywords: ["change mobile", "profile"],
  },
  {
    category: "Patient Account",
    question: "Why should I not share my password?",
    answer:
      "Your account may contain appointment, treatment, payment, and clinical information. Keep login details private.",
    keywords: ["password", "security"],
  },
  {
    category: "Patient Account",
    question: "Can I request account deletion?",
    answer:
      "Yes. Use the delete account request page or contact OPW. Some clinic records may need retention for legal or care reasons.",
    keywords: ["delete account", "privacy"],
  },
  {
    category: "Patient Account",
    question: "What data is stored in my account?",
    answer:
      "Your account may include profile details, appointments, clinical notes, therapy resources, treatment sessions, payment updates, feedback, and messages.",
    keywords: ["data", "account", "privacy"],
  },
  {
    category: "Patient Account",
    question: "Can I use the app without notifications?",
    answer:
      "You can use the app, but appointment and treatment reminders may not appear if notifications are disabled.",
    keywords: ["notifications", "permission"],
  },
  {
    category: "Patient Account",
    question: "How do I enable notifications?",
    answer:
      "Allow notification permission in the app and phone settings. If notifications still do not arrive, contact the clinic.",
    keywords: ["enable notifications", "phone settings"],
  },
  {
    category: "Patient Account",
    question: "Why do I see old notifications?",
    answer:
      "Notification history may show past clinic updates. Opened or read notifications may be hidden depending on app behavior.",
    keywords: ["old notification", "history"],
  },
  {
    category: "Live Chat",
    question: "What if I am not sure which service I need?",
    answer:
      "Use Live Chat if a staff member is online, or send a message from the contact form. You can briefly describe your pain, duration, and previous treatment so the team can guide the next step.",
    keywords: ["help", "which service", "live chat", "contact", "guidance"],
  },
  {
    category: "Live Chat",
    question: "Is live chat always available?",
    answer:
      "Live chat depends on staff availability. If no one is online, use the contact page or appointment request.",
    keywords: ["live chat available", "online"],
  },
  {
    category: "Live Chat",
    question: "Can I send files in chat?",
    answer:
      "If file attachment is available, you can share relevant files. Avoid sending unnecessary sensitive information.",
    keywords: ["chat file", "attachment"],
  },
  {
    category: "Live Chat",
    question: "Who responds to live chat?",
    answer:
      "Available OPW staff or admin users may respond based on clinic workflow and availability.",
    keywords: ["who responds", "staff"],
  },
  {
    category: "Live Chat",
    question: "Can chat replace an appointment?",
    answer:
      "No. Chat can guide next steps, but assessment and treatment decisions usually need proper clinic evaluation.",
    keywords: ["chat appointment", "replace"],
  },
  {
    category: "Home Service",
    question: "Is home physiotherapy available?",
    answer:
      "Home service may be available after OPW confirms suitability. It is not automatic for every condition or patient.",
    keywords: ["home physiotherapy", "home visit"],
  },
  {
    category: "Home Service",
    question: "Can first-time patients request home service?",
    answer:
      "First-time patients should visit the clinic first so the team can assess the condition and decide whether home service is suitable later.",
    keywords: ["first time home", "new patient"],
  },
  {
    category: "Home Service",
    question: "Why is post-session review at clinic required?",
    answer:
      "Clinic review helps the team reassess progress, update the plan, and decide whether continuing home care is safe and suitable.",
    keywords: ["review", "post session", "clinic"],
  },
  {
    category: "Home Service",
    question: "Can home service be cancelled?",
    answer:
      "Yes. Home service depends on suitability, availability, and clinic decision. Contact OPW for changes.",
    keywords: ["cancel home", "home service"],
  },
  {
    category: "Home Service",
    question: "What should I prepare for home service?",
    answer:
      "Keep enough safe space, previous reports, comfortable clothing, and any prescribed support items ready.",
    keywords: ["prepare home", "home visit"],
  },
  {
    category: "Clinic Information",
    question: "Where is Omm Physio World located?",
    answer:
      "Omm Physio World is located at Ananda Bazar, K C. Circle, near Khuntia Medecine, Baripada, Odisha 757001.",
    keywords: ["address", "location", "baripada"],
  },
  {
    category: "Clinic Information",
    question: "Which area does the clinic serve?",
    answer:
      "The clinic primarily serves Baripada and nearby areas in Odisha. Contact OPW to confirm service availability for your location.",
    keywords: ["service area", "nearby", "odisha"],
  },
  {
    category: "Clinic Information",
    question: "How can I contact the clinic?",
    answer:
      "Use the contact page, appointment request, phone, WhatsApp, or live chat when available. Share your name and registered mobile for faster help.",
    keywords: ["contact", "phone", "whatsapp"],
  },
  {
    category: "Clinic Information",
    question: "Does OPW offer emergency care?",
    answer:
      "OPW is a physiotherapy clinic and should not be used as emergency medical care. For emergencies, contact local emergency services or a hospital.",
    keywords: ["emergency", "urgent"],
  },
  {
    category: "Clinic Information",
    question: "Can I visit without appointment?",
    answer:
      "Contact the clinic first to confirm availability. Booking ahead helps the team manage time and patient flow.",
    keywords: ["walk in", "without appointment"],
  },
  {
    category: "Safety",
    question: "When should I see a doctor urgently?",
    answer:
      "Seek urgent medical care for severe trauma, chest pain, sudden weakness, loss of bladder or bowel control, high fever with pain, or rapidly worsening symptoms.",
    keywords: ["urgent", "doctor", "red flag"],
  },
  {
    category: "Safety",
    question: "Should I exercise with fever?",
    answer:
      "Avoid exercise when you have fever or acute illness unless a medical professional advises otherwise.",
    keywords: ["fever", "exercise", "sick"],
  },
  {
    category: "Safety",
    question: "Should I use heat or ice?",
    answer:
      "It depends on the condition and stage. Ice may help acute swelling; heat may help stiffness. Ask the clinic if unsure.",
    keywords: ["heat", "ice", "swelling"],
  },
  {
    category: "Safety",
    question: "Can I do YouTube exercises for pain?",
    answer:
      "Generic exercises may not suit your condition. If pain is persistent or worsening, get assessed before following random exercises.",
    keywords: ["youtube exercise", "online exercise"],
  },
  {
    category: "Safety",
    question: "What if I feel numbness or tingling?",
    answer:
      "Numbness or tingling can involve nerve irritation. If it is severe, sudden, spreading, or with weakness, seek medical review.",
    keywords: ["numbness", "tingling", "nerve"],
  },
  {
    category: "Safety",
    question: "Can physiotherapy help during pregnancy?",
    answer:
      "Some pregnancy-related pain can be supported with safe physiotherapy, but treatment should consider pregnancy stage and medical advice.",
    keywords: ["pregnancy", "safe", "women"],
  },
  {
    category: "Safety",
    question: "Can children take physiotherapy?",
    answer:
      "Children may need age-appropriate assessment and exercises. A parent or guardian should be involved.",
    keywords: ["children", "kids", "guardian"],
  },
  {
    category: "Safety",
    question: "What if pain becomes worse after a session?",
    answer:
      "Mild soreness can happen, but worsening or sharp pain should be reported to the clinic so the plan can be adjusted.",
    keywords: ["worse after session", "soreness"],
  },
  {
    category: "Safety",
    question: "Can I continue medicine with physiotherapy?",
    answer:
      "Continue medicines as prescribed by your doctor. Inform the clinic about medicines and medical conditions that may affect treatment.",
    keywords: ["medicine", "doctor", "prescription"],
  },
  {
    category: "Safety",
    question: "Do I need tests before physiotherapy?",
    answer:
      "Not always. Tests are needed only when clinically indicated or advised by a doctor. Bring existing reports if you have them.",
    keywords: ["test", "xray", "mri"],
  },
  {
    category: "Feedback",
    question: "Can I give feedback after treatment?",
    answer:
      "Yes. The clinic may ask for feedback after a session or treatment plan to improve patient care and follow-up.",
    keywords: ["feedback", "review"],
  },
  {
    category: "Feedback",
    question: "Why did I receive a feedback notification?",
    answer:
      "You may receive feedback requests after a session ends so OPW can understand your experience and recovery status.",
    keywords: ["feedback notification", "session ended"],
  },
  {
    category: "Feedback",
    question: "Is feedback private?",
    answer:
      "Feedback is used for clinic care and service improvement. Avoid sharing unnecessary sensitive information in public reviews.",
    keywords: ["feedback private", "review privacy"],
  },
  {
    category: "Feedback",
    question: "Can feedback help my follow-up plan?",
    answer:
      "Yes. Feedback about pain, progress, and difficulty can help the clinic decide whether review or plan changes are needed.",
    keywords: ["follow up", "feedback"],
  },
  {
    category: "Shop",
    question: "What is the shop section for?",
    answer:
      "The shop section may show clinic-related products or supportive items where available. Contact OPW before buying if unsure.",
    keywords: ["shop", "products"],
  },
  {
    category: "Shop",
    question: "Can products replace physiotherapy?",
    answer:
      "No. Products may support comfort or exercise, but they should not replace assessment, treatment, or medical advice.",
    keywords: ["product", "replace treatment"],
  },
  {
    category: "Shop",
    question: "How do I ask about a shop item?",
    answer:
      "Use the contact page or clinic communication options and mention the product name or issue you need help with.",
    keywords: ["shop help", "item"],
  },
  {
    category: "Career",
    question: "How can I apply for a job at OPW?",
    answer:
      "Visit the career page or job requirement page, check available requirements, and submit your details where the form is available.",
    keywords: ["career", "job", "apply"],
  },
  {
    category: "Career",
    question: "Can I upload my resume?",
    answer:
      "If the career form supports resume upload, attach your file with accurate contact details.",
    keywords: ["resume", "career upload"],
  },
  {
    category: "Career",
    question: "Will OPW contact me after job application?",
    answer:
      "The clinic may contact shortlisted applicants based on requirement, profile match, and availability.",
    keywords: ["job contact", "shortlist"],
  },
  {
    category: "Marketing",
    question: "Can clinics or medicine shops refer patients?",
    answer:
      "OPW may coordinate with local clinics, medicine shops, and institutes for patient awareness and referrals where appropriate.",
    keywords: ["refer patient", "medicine shop", "clinic"],
  },
  {
    category: "Marketing",
    question: "How can a doctor suggest OPW to a patient?",
    answer:
      "Doctors or partners can share OPW contact or ask the patient to book an appointment through the official website or clinic contact.",
    keywords: ["doctor suggest", "referral"],
  },
  {
    category: "Privacy",
    question: "Does OPW have a privacy policy?",
    answer:
      "Yes. The privacy policy explains what data may be collected, why it is used, and how users can request account or data support.",
    keywords: ["privacy policy", "data"],
  },
  {
    category: "Privacy",
    question: "Can AI assistants use my patient data?",
    answer:
      "Private patient records should not be used or summarized unless you explicitly provide them and consent to that use.",
    keywords: ["ai", "patient data", "private"],
  },
  {
    category: "Privacy",
    question: "What should I avoid sharing publicly?",
    answer:
      "Avoid sharing private reports, payment details, passwords, full medical records, or sensitive personal information in public forms or reviews.",
    keywords: ["public sharing", "sensitive"],
  },
  {
    category: "Privacy",
    question: "How can I request data correction?",
    answer:
      "Contact the clinic with your registered details and explain what needs correction. The team can guide the next step.",
    keywords: ["data correction", "update"],
  },
  {
    category: "Follow-up",
    question: "Will OPW remind me after treatment ends?",
    answer:
      "The system may send follow-up reminders after treatment completion, such as after 7 days, 15 days, or around one month depending on clinic workflow.",
    keywords: ["follow up reminder", "after treatment"],
  },
  {
    category: "Follow-up",
    question: "Why is follow-up important?",
    answer:
      "Follow-up helps check recovery, prevent recurrence, update exercises, and decide whether further review is needed.",
    keywords: ["follow up", "review"],
  },
  {
    category: "Follow-up",
    question: "Can I book a check-up after treatment?",
    answer:
      "Yes. If symptoms return or you need review, contact the clinic or request an appointment from your account.",
    keywords: ["check up", "after treatment"],
  },
  {
    category: "Follow-up",
    question: "Can I continue maintenance exercises?",
    answer:
      "Yes, if the clinic has given maintenance exercises. They should be done safely and adjusted if symptoms change.",
    keywords: ["maintenance exercise", "continue"],
  },
];

const copy = {
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
  faqItems,
};

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState("");
  const t = copy;
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
        schema={[
          createMedicalBusinessSchema({
            description:
              "FAQ answers from Omm Physio World about physiotherapy, rehabilitation, posture support, appointments, and patient guidance.",
            path: "/faq",
            pageName: "FAQ",
          }),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
          createFaqSchema(copy.faqItems),
        ]}
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
