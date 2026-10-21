"use client";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {LayoutDashboard,Users,CalendarX,Wallet,LogOut,Building2} from "lucide-react";
import {LanguageToggle,useLanguage,tx} from "./LanguageProvider";
import {supabase} from "../lib/supabase";
const items=[{href:"/",en:"Dashboard",mr:"मुख्य पृष्ठ",Icon:LayoutDashboard},{href:"/employees",en:"Employees",mr:"कर्मचारी",Icon:Users},{href:"/attendance",en:"Absences",mr:"अनुपस्थिती",Icon:CalendarX},{href:"/ledger",en:"Salary & advances",mr:"पगार आणि आगाऊ रक्कम",Icon:Wallet}];
export default function NavigationSidebar(){
 const pathname=usePathname();const router=useRouter();const {language}=useLanguage();
 async function logout(){await supabase().auth.signOut();router.replace("/login");router.refresh()}
 return <><aside className="app-sidebar"><Link href="/" className="sidebar-brand"><span className="brand-mark"><Building2 size={22}/></span><span>Morya<span className="accent">EMP</span></span></Link><nav aria-label="Main navigation" className="sidebar-links">{items.map(({href,en,mr,Icon})=><Link key={href} href={href} className={pathname===href?"sidebar-link active":"sidebar-link"}><Icon size={18}/><span>{tx(language,en,mr)}</span></Link>)}</nav><div className="sidebar-bottom"><LanguageToggle/><button className="sidebar-logout" onClick={logout}><LogOut size={17}/>{tx(language,"Sign out","बाहेर पडा")}</button></div></aside><nav className="mobile-app-nav" aria-label="Main navigation">{items.map(({href,en,mr,Icon})=><Link key={href} href={href} aria-label={tx(language,en,mr)} className={pathname===href?"mobile-nav-link active":"mobile-nav-link"}><Icon size={19}/><span>{tx(language,en,mr)}</span></Link>)}</nav></>
}
