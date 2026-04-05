import { Link } from "wouter";
import { Youtube, Linkedin, Facebook, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-background to-[#3a9ca5]/[0.02] border-t border-border pt-10 pb-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-foreground mb-1">
              <span className="border-b-2 border-[#3a9ca5]/30 pb-0.5">Contact Us</span>
            </h3>
            <div className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <Phone size={14} className="shrink-0 text-[#3a9ca5]" />
              <a href="tel:01245633231">01245 633 231</a>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <Mail size={14} className="shrink-0 text-[#3a9ca5]" />
              <a href="mailto:info@rhythmstix.co.uk">info@rhythmstix.co.uk</a>
            </div>
            <div className="flex items-start gap-2.5 text-muted-foreground text-sm">
              <MapPin size={14} className="mt-0.5 shrink-0 text-[#3a9ca5]" />
              <address className="not-italic text-xs leading-relaxed">
                Rhythmstix Ltd, 33 Vicarage Road<br />
                Chelmsford, Essex CM2 9BP
              </address>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:items-center">
            <div className="w-full md:w-auto">
              <h3 className="text-sm font-bold text-foreground mb-2">
                <span className="border-b-2 border-[#3a9ca5]/30 pb-0.5">Links</span>
              </h3>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <li><Link href="/blog" className="text-muted-foreground hover:text-[#3a9ca5] transition-colors text-xs">Blog</Link></li>
                <li><Link href="/shop" className="text-muted-foreground hover:text-[#3a9ca5] transition-colors text-xs">Shop</Link></li>
                <li><Link href="/page/about" className="text-muted-foreground hover:text-[#3a9ca5] transition-colors text-xs">About Us</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-[#3a9ca5] transition-colors text-xs">Contact Us</Link></li>
                <li><Link href="/page/policy" className="text-muted-foreground hover:text-[#3a9ca5] transition-colors text-xs">Privacy Notice</Link></li>
                <li><Link href="/cookies" className="text-muted-foreground hover:text-[#3a9ca5] transition-colors text-xs">Cookies</Link></li>
                <li><Link href="/page/copyright-and-licenses" className="text-muted-foreground hover:text-[#3a9ca5] transition-colors text-xs">Copyright</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-foreground mb-1">
              <span className="border-b-2 border-[#3a9ca5]/30 pb-0.5">Follow Us</span>
            </h3>
            <div className="flex items-center gap-3">
              <a href="https://www.youtube.com/@RhythmstixMusicForEducation" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-[#3a9ca5] hover:text-white transition-all">
                <Youtube size={16} />
              </a>
              <a href="https://www.linkedin.com/in/robert-reich-storer-974449144/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-[#3a9ca5] hover:text-white transition-all">
                <Linkedin size={14} />
              </a>
              <a href="https://www.facebook.com/rhythmstix" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-[#3a9ca5] hover:text-white transition-all">
                <Facebook size={16} />
              </a>
            </div>
          </div>

        </div>

        <div className="pt-4 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span className="font-bold text-foreground/80">rhythm<span className="text-[#3a9ca5]">stix</span></span>
            <span>© 2021</span>
          </div>
          <p className="text-[10px] text-muted-foreground/50">
            Designed for education.
          </p>
        </div>
      </div>
    </footer>
  );
}
