"use client";
import {createContext,useContext,useEffect,useState,ReactNode} from "react";
export type Language="en"|"mr";
const LanguageContext=createContext<{language:Language;setLanguage:(language:Language)=>void}>({language:"en",setLanguage:()=>{}});
export function LanguageProvider({children}:{children:ReactNode}){
 const [language,setLanguageState]=useState<Language>("en");
 useEffect(()=>{const saved=window.localStorage.getItem("morya-language");if(saved==="mr"||saved==="en")setLanguageState(saved)},[]);
 function setLanguage(next:Language){setLanguageState(next);window.localStorage.setItem("morya-language",next);document.documentElement.lang=next==="mr"?"mr":"en"}
 return <LanguageContext.Provider value={{language,setLanguage}}>{children}</LanguageContext.Provider>
}
export function useLanguage(){return useContext(LanguageContext)}
export function LanguageToggle(){const {language,setLanguage}=useLanguage();return <div className="language-toggle" role="group" aria-label="Choose language"><button type="button" className={language==="en"?"active":""} onClick={()=>setLanguage("en")}>English</button><button type="button" className={language==="mr"?"active":""} onClick={()=>setLanguage("mr")}>मराठी</button></div>}
export function tx(language:Language,english:string,marathi:string){return language==="mr"?marathi:english}
