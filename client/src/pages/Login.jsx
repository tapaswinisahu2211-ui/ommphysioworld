import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await API.post("/admin/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (loginError) {
      setError(
        loginError.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      
      {/* LEFT SIDE */}
      <div className="motion-panel hidden w-1/2 items-center justify-center bg-blue-600 text-white md:flex">
        <div className="animate-slide-up">
          <h1 className="text-4xl font-bold mb-4">Omm Physio World</h1>
          <p className="text-lg">
            Admin Panel for managing appointments & services
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex w-full items-center justify-center bg-gray-100 md:w-1/2">
        <div className="motion-card animate-slide-up-delayed w-96 rounded-2xl bg-white p-8 shadow-xl transition hover:shadow-2xl">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to website
          </Link>
          
          <h2 className="text-2xl font-bold mb-6 text-center">
            Staff / Admin Login
          </h2>

          <form onSubmit={handleLogin}>
            
            {/* Email */}
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter email"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="mb-4 relative">
              <label className="block mb-1 text-sm font-medium">
                Password
              </label>
              <input
                type={show ? "text" : "password"}
                placeholder="Enter password"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <span
                onClick={() => setShow(!show)}
                className="absolute right-3 top-10 cursor-pointer text-sm text-blue-600"
              >
                {show ? "Hide" : "Show"}
              </span>
            </div>

            {/* Remember me */}
            <div className="flex items-center mb-6">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm">Remember me</span>
            </div>

            {error ? (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 p-3 text-white transition transform hover:scale-[1.02] hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

