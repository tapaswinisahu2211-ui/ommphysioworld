import { ArrowRight, BriefcaseBusiness, MapPin, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import PublicLayout from "../layout/PublicLayout";
import API from "../services/api";
import { createBreadcrumbSchema, createMedicalBusinessSchema } from "../utils/seo";

const DetailChip = ({ icon: Icon, label }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
    <Icon size={14} />
    {label}
  </div>
);

export default function CareerRequirementsPage() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRequirements = async () => {
      try {
        const response = await API.get("/public-job-requirements");
        setRequirements(response.data);
        setError("");
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Failed to load job requirements.");
      } finally {
        setLoading(false);
      }
    };

    loadRequirements();
  }, []);

  return (
    <PublicLayout>
      <Seo
        title="Career Requirements at Omm Physio World"
        description="Explore open staff requirements at Omm Physio World and review role details before applying."
        path="/career/requirements"
        schema={[
          createMedicalBusinessSchema({
            description:
              "Public job requirement listings for clinic, reception, therapist, and support roles at Omm Physio World.",
            path: "/career/requirements",
            pageName: "Career Requirements",
          }),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Career", path: "/career" },
            { name: "Requirements", path: "/career/requirements" },
          ]),
        ]}
      />

      <section className="page-section mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="rounded-[36px] bg-gradient-to-r from-slate-950 via-cyan-950 to-emerald-900 px-8 py-10 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <p className="text-sm uppercase tracking-[0.24em] text-white/60">Career Requirement</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Current openings at Omm Physio World
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75">
            Review the latest employee requirements, role expectations, and clinic work details
            before applying.
          </p>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-8 space-y-6">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
              Loading job requirements...
            </div>
          ) : requirements.length ? (
            requirements.map((item) => (
              <article
                key={item.id}
                className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold text-slate-950">{item.title}</h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.isPublished
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.isPublished ? "Open" : "Draft"}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {item.summary || "Please contact the clinic to learn more about this role."}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {item.department ? (
                        <DetailChip icon={BriefcaseBusiness} label={item.department} />
                      ) : null}
                      {item.location ? <DetailChip icon={MapPin} label={item.location} /> : null}
                      <DetailChip icon={Users} label={`${item.openings} opening${item.openings > 1 ? "s" : ""}`} />
                      {item.employmentType ? (
                        <DetailChip icon={BriefcaseBusiness} label={item.employmentType} />
                      ) : null}
                      {item.experience ? (
                        <DetailChip icon={BriefcaseBusiness} label={item.experience} />
                      ) : null}
                    </div>
                  </div>

                  <Link
                    to={`/career?role=${encodeURIComponent(item.title)}`}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800"
                  >
                    Apply for This Role
                    <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="mt-8 grid gap-4 xl:grid-cols-3">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Responsibilities
                    </h3>
                    <div className="mt-4 space-y-3">
                      {item.responsibilities.length ? (
                        item.responsibilities.map((entry, index) => (
                          <p key={`${item.id}-responsibility-${index}`} className="text-sm leading-6 text-slate-700">
                            {entry}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Responsibilities will be shared during screening.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-slate-50 p-5">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Requirements
                    </h3>
                    <div className="mt-4 space-y-3">
                      {item.requirements.length ? (
                        item.requirements.map((entry, index) => (
                          <p key={`${item.id}-requirement-${index}`} className="text-sm leading-6 text-slate-700">
                            {entry}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Requirement details will be shared during screening.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-slate-50 p-5">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Benefits
                    </h3>
                    <div className="mt-4 space-y-3">
                      {item.benefits.length ? (
                        item.benefits.map((entry, index) => (
                          <p key={`${item.id}-benefit-${index}`} className="text-sm leading-6 text-slate-700">
                            {entry}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Benefits will be discussed during the interview process.</p>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
              <p className="text-lg font-semibold text-slate-900">We are not hiring right now</p>
              <p className="mt-2 text-sm text-slate-500">
                We do not have any active job posts at the moment, but you can still share your
                details and resume with us for future opportunities.
              </p>
              <Link
                to="/career"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
              >
                Share Your Details
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}

