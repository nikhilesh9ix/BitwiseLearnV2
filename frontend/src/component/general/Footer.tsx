import { Facebook, Github, Instagram, Linkedin } from "lucide-react";
import Link from "next/link";
import BitwiseImage from "@/app/images/BitwiseImage.png";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import Image from "next/image";
import logo from "../../../public/images/Logo.png";

export default function Footer() {
  const Colors = getColors();

  return (
    <footer
      className={`${Colors.background.primary} ${Colors.border.default} backdrop-blur-lg py-8 px-6 transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Company Info & Social Media */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <Link href="/">
            <Image src={logo} alt="Logo" height={40} />
          </Link>
          <p className={`text-sm max-w-62.5 mb-4 ${Colors.text.special}`}>
            Learn, Code, Grow.
          </p>
          <div className="flex space-x-4">
            <a
              href="#"
              aria-label="Facebook"
              className={`transition-colors ${Colors.text.primary} hover:text-blue-600`}
            >
              <Facebook size={22} />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className={`transition-colors ${Colors.text.primary} hover:text-yellow-400`}
            >
              <Instagram size={22} />
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className={`transition-colors ${Colors.text.primary} hover:text-blue-400`}
            >
              <Linkedin size={22} />
            </a>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="text-center sm:text-left">
          <h4 className={`font-bold text-lg mb-4 ${Colors.text.primary}`}>
            Quick Links
          </h4>
          <ul className={`space-y-2 ${Colors.text.secondary}`}>
            {["Home", "About", "Contact"].map((item) => (
              <li key={item}>
                <a
                  href={`${item === "Home" ? "/" : item.toLowerCase()}`}
                  className="hover:font-semibold transition-all duration-200"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center sm:text-left">
          <h4 className={`font-bold text-lg mb-4 ${Colors.text.primary}`}>
            Logins
          </h4>
          <ul className={`space-y-2 ${Colors.text.secondary}`}>
            {["Other Login"].map((item) => (
              <li key={item}>
                <Link
                  href={`/multi-login`}
                  className="hover:font-semibold transition-all duration-200"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div className="text-center sm:text-left">
          <h4 className={`font-bold text-lg mb-4 ${Colors.text.primary}`}>
            Contact
          </h4>
          <ul className={`space-y-2 ${Colors.text.secondary}`}>
            <li>
              <p>Email : sales_support@bitwiselearn.com</p>
            </li>
            <li>
              <p>Phone : +91 9787777547</p>
            </li>
            <li>Address : Banglore India</li>
          </ul>
        </div>
      </div>

      {/* Divider + Copyright */}
      <div
        className={`mt-8 pt-3 border-t ${Colors.background.primary} text-center text-sm ${Colors.text.secondary}`}
      >
        &copy; {new Date().getFullYear()} Bitwise Learn. All rights reserved.
      </div>
    </footer>
  );
}


