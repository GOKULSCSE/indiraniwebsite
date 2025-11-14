"use client"

import type * as React from "react"
import { BarChart3, ClipboardList, FolderUp, Settings, ShoppingCart, Store, Truck, Wallet, HeartHandshake, LogOut, MapPinned, FileText } from "lucide-react"
import Image from "next/image"
import "./app-sidebar.css"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"




import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import Link from "next/link"

const navItems = [
  {
    title: "Ecommerce",
    icon: Store,
    url: "/seller",
  },
  // {
  //   title: "Analysis",
  //   icon: BarChart3,
  //   url: "/seller/analysis",
  //   isActive:true
  // },
  {
    title: "Products",
    icon: ShoppingCart,
    url: "/seller/products",
    isActive: true
  },
  {
    title: "Orders",
    icon: ClipboardList,
    url: "/seller/orders",
    isActive: true
  },
  {
    title: "Payments",
    icon: Wallet,
    url: "/seller/payments",
    isActive: true
  },

  {
    title: "Settings",
    icon: Settings,
    url: "/seller/settings",
    isActive: true
  },
  {
    title: "Bulk Upload",
    icon: FolderUp,
    url: "/seller/upload",
    isActive: true
  },
  {
    title: "Helpers",
    icon: HeartHandshake,
    url: "/seller/helpers",
    isActive: true
  },
  {
    title: "Pickup Locations",
    icon: MapPinned ,
    url: "/seller/pickup",
    isActive: true
  },
  {
    title: "Shipments",
    icon: Truck ,
    url: "/seller/shipments",
    isActive: true
  },
  {
    title: "Settlement",
    icon: Wallet,
    url: "/seller/settlement",
    isActive: true
  },
  {
    title: "Invoice",
    icon: FileText,
    url: "/seller/invoice",
    isActive: true
  },

]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter()



  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }
  return (
    <Sidebar collapsible="icon" className="sidebar-custom relative self-start mt-[-100vh]" {...props}>
      <SidebarHeader className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 sidebar-menu">
          <div className="flex-shrink-0 overflow-hidden">
            <Link href={"/"}>
              <Image
                src="/assets/indiranilogo.png"
                alt="Kaaladi Handicrafts"
                width={100}
                height={40}
                className="h-[2rem] w-auto absolute top-2 left-[25%]"
              />
            </Link>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarMenu className="sidebar-menu">
          {navItems.map((item) => {
            const isActive = pathname === item.url;
            return (
              <SidebarMenuItem key={item.title} className="sidebar-menu-item">
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                  className={`sidebar-menu-button ${isActive ? "active" : ""}`}
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarMenu className="absolute bottom-4 w-full">
        <SidebarMenuItem>
          <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
            <LogOut />
            <span>Logout</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>



      <SidebarRail />
    </Sidebar>
  )
}

