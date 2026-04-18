import { LockKeyhole, LogIn, Mail, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PublicLayout from "../layout/PublicLayout";
import API from "../services/api";
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
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!isForgot && getPatientUser()) {
      navigate(redirectTo, { replace: true });
    }
  }, [isForgot, navigate, redirectTo]);

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

  return (
    <PublicLayout>
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
