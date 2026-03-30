"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  User,
  School,
  Handshake,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { getAllStats, type AdminDashboardStats } from "@/api/admins/get-admin-stats";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import { useAdmin } from "@/store/adminStore";
import useLogs from "@/lib/useLogs";

type EntityTabsProps = {
  fields: string[];
  data: AdminDashboardStats;
};

type EntityMeta = {
  icon: LucideIcon;
  label: string;
  tagline: string;
  accent: string;
};

const Colors = getColors();

const URL_MAP: Record<string, string> = {
  admins: "/admin-dashboard/admins",
  institutions: "/admin-dashboard/institutions",
  batches: "/admin-dashboard/batches",
  vendors: "/admin-dashboard/vendors",
};

const ENTITY_META: Record<string, EntityMeta> = {
  admins: {
    icon: ShieldCheck,
    label: "Admins",
    tagline: "People maintaining our platform",
    accent: "from-orange-500/20 to-orange-500/5",
  },
  vendors: {
    icon: Handshake,
    label: "Vendors",
    tagline: "Industry trainers who got involved",
    accent: "from-emerald-500/20 to-emerald-500/5",
  },
  institutions: {
    icon: School,
    label: "Institutions",
    tagline: "Education centers associated with us",
    accent: "from-blue-500/20 to-blue-500/5",
  },
  batches: {
    icon: Users,
    label: "Batches",
    tagline: "Student groups managed across institutions",
    accent: "from-purple-500/20 to-purple-500/5",
  },
};

function Header() {
  const admin = useAdmin();

  if (!admin.info?.data) {
    return null;
  }

  const { name, email } = admin.info.data;

  return (
    <div className="flex justify-between p-4">
      <div>
        <span className={`text-5xl ${Colors.text.special}`}>Greetings,</span>{" "}
        <span className={`text-5xl ${Colors.text.primary}`}>{name}</span>
        <div className="mt-2 text-lg">
          <span className={Colors.text.primary}>Enjoy managing</span>{" "}
          <span className={Colors.text.special}>B</span>
          <span className={Colors.text.primary}>itwise Learn</span>
        </div>
      </div>

      <div className="flex mr-11">
        <div className="p-8 bg-white rounded-full flex justify-center items-center">
          <User size={35} color="black" />
        </div>
        <div className={`${Colors.text.primary} flex flex-col mt-3 ml-4`}>
          <h1 className="text-3xl">{name}</h1>
          <p>{email}</p>
        </div>
      </div>
    </div>
  );
}

function EntityTabs({ fields, data }: EntityTabsProps) {
  const { loading, role } = useLogs();

  if (!fields.length) {
    return <p className="text-white/60 text-center mt-6">Loading dashboard...</p>;
  }

  return (
    <div className="mx-20 mt-8 grid grid-cols-1 gap-3">
      {fields.map((field) => {
        const meta = ENTITY_META[field];
        const href = URL_MAP[field];

        if (!meta || !href) {
          return null;
        }

        if (field === "admins" && !loading && role !== 0) {
          return null;
        }

        const Icon = meta.icon;

        return (
          <Link
            key={field}
            href={href}
            className={`
              group relative rounded-2xl p-6
              ${Colors.background.secondary} overflow-hidden
              hover:shadow-2xl hover:-translate-y-1
              transition-all duration-300
            `}
          >
            <div
              className={`absolute inset-0 bg-linear-to-br ${meta.accent} opacity-0 group-hover:opacity-100 transition`}
            />

            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${Colors.background.primary}`}>
                  <Icon className="text-primaryBlue" size={28} />
                </div>
                <span className={`text-3xl font-bold ${Colors.text.primary}`}>
                  {data[field] ?? 0}
                </span>
              </div>

              <div>
                <h3 className={`text-lg font-semibold ${Colors.text.primary}`}>
                  {meta.label}
                </h3>
                <p className={`text-sm mt-1 ${Colors.text.secondary}`}>
                  {meta.tagline}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function HeroSection() {
  const [tabs, setTabs] = useState<AdminDashboardStats>({});

  useEffect(() => {
    void getAllStats(setTabs);
  }, []);

  const fields = useMemo(() => Object.keys(tabs), [tabs]);

  return (
    <>
      <Header />
      <EntityTabs fields={fields} data={tabs} />
    </>
  );
}


