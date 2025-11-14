import type React from "react"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

interface SupportItemProps {
  icon: React.ReactNode
  title: string
  description: string
  href: string
}

const SupportItem: React.FC<SupportItemProps> = ({ icon, title, description, href }) => {
  return (
    <Link href={href} className="flex items-center justify-between py-4 hover:bg-gray-50">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-green-100 rounded-md flex items-center justify-center text-green-600">{icon}</div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400" />
    </Link>
  )
}

export default function CustomerSupport() {
  return (
    <div className="max-w-2xl px-2">
      <h1 className="text-2xl font-bold mb-6">Customer Support</h1>

      <div>
        <SupportItem
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-truck"
            >
              <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
              <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
              <circle cx="7" cy="18" r="2" />
              <circle cx="17" cy="18" r="2" />
            </svg>
          }
          title="Track Order"
          description="View delivery status"
          href="/track-order"
        />

        <SupportItem
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-refresh-ccw"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
          }
          title="Returns & Refunds"
          description="Easy return process"
          href="/returns"
        />

        <SupportItem
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-message-circle"
            >
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
          }
          title="Live Chat"
          description="Chat with our support"
          href="/live-chat"
        />

        <SupportItem
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-help-circle"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          }
          title="FAQs"
          description="Common questions answered"
          href="/faqs"
        />
      </div>
    </div>
  )
}
