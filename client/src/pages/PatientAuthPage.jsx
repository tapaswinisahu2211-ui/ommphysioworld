import { LockKeyhole, LogIn, Mail, MessageCircle, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PublicLayout from "../layout/PublicLayout";
import API from "../services/api";
import Seo from "../components/Seo";
import { getPatientUser, savePatientUser } from "../utils/patientAuth";
import {
  cleanEmail,
  cleanPhone,
  firstValidationError,
  validateEmailField,
  validatePhoneField,
} from "../utils/validation";

export default function PatientAuthPage({ mode = "login" }) {
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/patient-dashboard";
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [whatsappSubmitting, setWhatsappSubmitting] = useState(false);
  const [whatsappMobile, setWhatsappMobile] = useState("");
  const [whatsappOtp, setWhatsappOtp] = useState("");
  const [whatsappOtpSent, setWhatsappOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!isForgot && getPatientUser()) {
      navigate(redirectTo, { replace: true });
    }
  }, [isForgot, navigate, redirectTo]);

  useEffect(() => {
    try {
      const sessionMessage = sessionStorage.getItem("opwSessionExpiredMessage") || "";

      if (sessionMessage) {
        setError(sessionMessage);
        sessionStorage.removeItem("opwSessionExpiredMessage");
      }
    } catch (_) {
      // Ignore storage read failures.
    }
  }, []);

  const copy = useMemo(
    () =>
      isForgot
        ? {
            eyebrow: "Forgot Password",
            title: "Get a temporary password on your email.",
            text: "Enter your patient login email and OPW will send a temporary password to your inbox.",
            button: "Send Password",
            switchText: "Remember your password?",
            switchLink: "Back to login",
            switchPath: `/patient-login?redirect=${encodeURIComponent(redirectTo)}`,
          }
        : isRegister
        ? {
            eyebrow: "Patient Register",
            title: "Create your OMM Physio World patient account.",
            text: "Register once, then request appointments and continue care updates from your account.",
            button: "Create Account",
            switchText: "Already have an account?",
            switchLink: "Login",
            switchPath: `/patient-login?redirect=${encodeURIComponent(redirectTo)}`,
          }
        : {
            eyebrow: "Patient Login",
            title: "Login before requesting an appointment.",
            text: "Your appointment request, clinical notes, and care updates stay connected to your patient profile.",
            button: "Login",
            switchText: "New patient?",
            switchLink: "Register",
            switchPath: `/patient-register?redirect=${encodeURIComponent(redirectTo)}`,
          },
    [isForgot, isRegister, redirectTo]
  );
  const seoTitle = isForgot
    ? "Patient Forgot Password"
    : isRegister
    ? "Patient Register"
    : "Patient Login";
  const seoDescription = isForgot
    ? "Recover your OPW patient account password through email."
    : isRegister
    ? "Create your Omm Physio World patient account to request appointments and track care updates."
    : "Login to your Omm Physio World patient account to access appointments, therapy, sessions, payments, and orders.";
  const seoPath = isForgot
    ? "/patient-forgot-password"
    : isRegister
    ? "/patient-register"
    : "/patient-login";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    const validationError = firstValidationError([
      !isForgot && isRegister && !form.name.trim() ? "Full name is required." : "",
      !isForgot && isRegister && form.name.trim().length < 2 ? "Full name must be at least 2 characters." : "",
      validateEmailField(form.email),
      !isForgot && isRegister ? validatePhoneField(form.mobile) : "",
      !isForgot && !form.password ? "Password is required." : "",
      !isForgot && form.password && form.password.length < 6
        ? "Password must be at least 6 characters."
        : "",
    ]);

    if (validationError) {
      setError(validationError);
      setSubmitting(false);
      return;
    }

    try {
      if (isForgot) {
        const response = await API.post("/auth/forgot-password", {
          email: cleanEmail(form.email),
        });
        setNotice(
          response.data?.message ||
            "If your email is registered, a temporary password has been sent."
        );
      } else {
        const endpoint = isRegister ? "/auth/register" : "/auth/login";
        const payload = isRegister
          ? {
              name: form.name.trim(),
              email: cleanEmail(form.email),
              mobile: cleanPhone(form.mobile),
              password: form.password,
              createdFrom: "website",
            }
          : {
              email: cleanEmail(form.email),
              password: form.password,
            };

        const response = await API.post(endpoint, payload);
        savePatientUser({
          ...response.data.user,
          token: response.data.token,
        });
        navigate(redirectTo, { replace: true });
      }
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          "Unable to continue. Please check your details and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const requestWhatsAppOtp = async () => {
    setError("");
    setNotice("");

    const phoneError = validatePhoneField(whatsappMobile);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    setWhatsappSubmitting(true);
    try {
      const response = await API.post("/auth/whatsapp/request-otp", {
        mobile: cleanPhone(whatsappMobile),
      });
      setWhatsappOtpSent(true);
      setNotice(response.data?.message || "WhatsApp OTP sent.");
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          "Unable to send WhatsApp OTP. Please use email login."
      );
    } finally {
      setWhatsappSubmitting(false);
    }
  };

  const verifyWhatsAppOtp = async () => {
    setError("");
    setNotice("");

    const phoneError = validatePhoneField(whatsappMobile);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    if (!/^\d{6}$/.test(whatsappOtp.trim())) {
      setError("Please enter the 6-digit WhatsApp OTP.");
      return;
    }

    setWhatsappSubmitting(true);
    try {
      const response = await API.post("/auth/whatsapp/verify", {
        mobile: cleanPhone(whatsappMobile),
        otp: whatsappOtp.trim(),
      });
      savePatientUser({
        ...response.data.user,
        token: response.data.token,
      });
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          "Unable to verify WhatsApp OTP. Please try again."
      );
    } finally {
      setWhatsappSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={seoPath}
        robots="noindex, nofollow"
      />
      <section className="page-section mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="motion-panel relative overflow-hidden rounded-[36px] bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-800 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_34%)]" />
            <div className="relative z-10">
              <div className="inline-flex rounded-2xl bg-white/10 p-4">
                {isForgot ? (
                  <Mail size={28} />
                ) : isRegister ? (
                  <UserPlus size={28} />
                ) : (
                  <LockKeyhole size={28} />
                )}
              </div>
              <p className="mt-8 text-sm uppercase tracking-[0.25em] text-white/60">
                {copy.eyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight">
                {copy.title}
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/75">
                {copy.text}
              </p>
              <div className="mt-8 grid gap-3 text-sm text-white/80">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                  {isForgot
                    ? "Temporary password goes to the patient login email"
                    : "Request appointments only after login"}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                  {isForgot
                    ? "Use the received password to login and change it from profile"
                    : "Patient account is linked with your OPW patient record"}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                  Website and mobile both use the same patient account
                </div>
              </div>
            </div>
          </div>

          <div className="motion-card rounded-[36px] border border-slate-200 bg-white/95 p-8 shadow-sm">
            <h2 className="text-3xl font-semibold text-slate-950">
              {copy.eyebrow}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Continue to book appointment after account access.
            </p>

            {notice ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {notice}
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
              {isRegister ? (
                <>
                  <input
                    className="input rounded-2xl border-slate-200 bg-slate-50"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    required
                  />
                  <input
                    className="input rounded-2xl border-slate-200 bg-slate-50"
                    placeholder="Mobile Number"
                    value={form.mobile}
                    onChange={(event) =>
                      setForm({ ...form, mobile: event.target.value })
                    }
                    required
                  />
                </>
              ) : null}
              <input
                type="email"
                className="input rounded-2xl border-slate-200 bg-slate-50"
                placeholder="Email Address"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                required
              />
              {!isForgot ? (
                <input
                  type="password"
                  className="input rounded-2xl border-slate-200 bg-slate-50"
                  placeholder="Password"
                  value={form.password}
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                  required
                  minLength={6}
                />
              ) : null}
              <button
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isForgot ? (
                  <Mail size={18} />
                ) : isRegister ? (
                  <UserPlus size={18} />
                ) : (
                  <LogIn size={18} />
                )}
                {submitting ? "Please wait..." : copy.button}
              </button>
            </form>

            {!isRegister && !isForgot ? (
              <p className="mt-4 text-center text-sm text-slate-500">
                <Link
                  className="font-semibold text-sky-700"
                  to={`/patient-forgot-password?redirect=${encodeURIComponent(redirectTo)}`}
                >
                  Forgot password?
                </Link>
              </p>
            ) : null}

            {!isRegister && !isForgot ? (
              <div className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-950">Login with WhatsApp</h3>
                    <p className="mt-1 text-sm leading-6 text-emerald-900">
                      Enter your registered WhatsApp mobile number. We will send a 6-digit OTP.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <input
                    className="input rounded-2xl border-emerald-200 bg-white"
                    placeholder="WhatsApp mobile number"
                    value={whatsappMobile}
                    onChange={(event) => {
                      setWhatsappMobile(event.target.value);
                      setWhatsappOtpSent(false);
                      setWhatsappOtp("");
                    }}
                  />
                  {whatsappOtpSent ? (
                    <input
                      className="input rounded-2xl border-emerald-200 bg-white"
                      placeholder="Enter 6-digit OTP"
                      value={whatsappOtp}
                      maxLength={6}
                      onChange={(event) =>
                        setWhatsappOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                    />
                  ) : null}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={whatsappSubmitting}
                      onClick={requestWhatsAppOtp}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <MessageCircle size={17} />
                      {whatsappOtpSent ? "Resend OTP" : "Send OTP"}
                    </button>
                    <button
                      type="button"
                      disabled={!whatsappOtpSent || whatsappSubmitting}
                      onClick={verifyWhatsAppOtp}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <LogIn size={17} />
                      Verify & Login
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <p className="mt-6 text-center text-sm text-slate-500">
              {copy.switchText}{" "}
              <Link className="font-semibold text-sky-700" to={copy.switchPath}>
                {copy.switchLink}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
