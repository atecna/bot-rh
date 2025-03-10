import { ConversationHeaderProps } from "../types/chat";
import { motion } from "framer-motion";
import { useOutletContext } from "@remix-run/react";
import { useState, useEffect, useRef } from "react";

export default function ConversationHeader({
  title,
  onMenuToggle,
}: ConversationHeaderProps) {
  const { userName, basePath } = useOutletContext<{ userName: string, basePath: string }>();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white md:bg-transparent md:border-none md:justify-end text-black py-3 px-4 flex justify-between items-center border-b border-gray-100"
    >
      <motion.button
        onClick={onMenuToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="text-atecna-corail hover:text-atecna-corail/90 transition-colors md:hidden"
        title="Voir les conversations"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </motion.button>

      <motion.h1
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-lg font-medium text-atecna-vert-fonce md:hidden"
      >
        {title}
      </motion.h1>

      <div className="flex items-center">
        <div className="relative" ref={menuRef}>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-full bg-atecna-corail text-white flex items-center justify-center cursor-pointer"
          >
            {userName
              .split(" ")
              .map((name) => name[0])
              .join("")
              .toUpperCase()}
          </motion.div>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <a
                href={`${basePath}/auth/logout`}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Se déconnecter
              </a>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
