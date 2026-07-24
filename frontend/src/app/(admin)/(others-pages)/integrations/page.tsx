import {
  GmailIcon,
  GoogleMeetIcon,
  JiraIcon,
  LinearIcon,
  LoomIcon,
  MailchimpIcon,
  NotionIcon,
  TrelloIcon,
  ZoomIcon,
} from "@/components/integration/icon";
import IntegrationBreadcrumb from "@/components/integration/IntegrationBreadcrumb";
import IntegrationCard from "@/components/integration/IntegrationCard";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title:
    "Next.js Integrations Page | TailAdmin - Next.js Admin Dashboard Template",
  description:
    "This is Next.js Integrations page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const integrationData = [
  {
    id: "mailchimp",
    title: "Mailchimp",
    description:
      "Connect Mailchimp to streamline your email marketing—automate campaigns.",
    icon: <MailchimpIcon />,
    connect: true,
  },
  {
    id: "gmeet",
    title: "Google Meet",
    description:
      "Connect your Google Meet account for seamless video conferencing.",
    icon: <GoogleMeetIcon />,
    connect: false,
  },
  {
    id: "zoom",
    title: "Zoom",
    description:
      "Integrate Zoom to streamline your virtual meetings and team collaborations",
    icon: <ZoomIcon />,
    connect: false,
  },
  {
    id: "loom",
    title: "Loom",
    description:
      "Integrate Loom to easily record, share, and manage video messages",
    icon: <LoomIcon />,
    connect: false,
  },
  {
    id: "linear",
    title: "Linear",
    description:
      "Integrate Linear to manage issues, track progress, and streamline your team’s.",
    icon: <LinearIcon />,
    connect: false,
  },
  {
    id: "gmail",
    title: "Gmail",
    description:
      "Integrate Gmail to send, receive, and manage emails directly from your workspace.",
    icon: <GmailIcon />,
    connect: false,
  },
  {
    id: "trello",
    title: "Trello",
    description: "Capture, organize, and tackle your to-dos from anywhere.",
    icon: <TrelloIcon />,
    connect: false,
  },
  {
    id: "notion",
    title: "Notion",
    description: "Capture, organize, and tackle your to-dos from anywhere.",
    icon: <NotionIcon />,
    connect: false,
  },
  {
    id: "jira",
    title: "Jira",
    description:
      "Track issues and manage projects with ease and full team visibility.",
    icon: <JiraIcon />,
    connect: false,
  },
];

export default function IntegrationPage() {
  return (
    <div>
      <IntegrationBreadcrumb pageTitle="Integrations" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {integrationData.map((item) => (
          <IntegrationCard
            key={item.id}
            title={item.title}
            icon={item.icon}
            description={item.description}
            connect={item.connect}
          />
        ))}
      </div>
    </div>
  );
}
