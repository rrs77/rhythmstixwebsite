import { Link } from "wouter";
import { Youtube, Linkedin, Facebook, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-background to-[#3a9ca5]/[0.03] border-t border-[#3a9ca5]/10 pt-16 pb-8 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-[#3a9ca5]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              <span className="border-b-2 border-[#3a9ca5]/40 pb-1">Contact Us</span>
            </h3>
            <div className="flex items-start gap-3 text-muted-foreground hover:text-foreground transition-colors">
              <Phone size={18} className="mt-0.5 shrink-0 text-primary" />
              <a href="tel:01245633231">01245 633 231</a>
            </div>
            <div className="flex items-start gap-3 text-muted-foreground hover:text-foreground transition-colors">
              <Mail size={18} className="mt-0.5 shrink-0 text-primary" />
              <a href="mailto:info@rhythmstix.co.uk">info@rhythmstix.co.uk</a>
            </div>
            <div className="flex items-start gap-3 text-muted-foreground">
              <MapPin size={18} className="mt-1 shrink-0 text-primary" />
              <address className="not-italic text-sm leading-relaxed">
                Rhythmstix Ltd<br />
                33 Vicarage Road<br />
                Chelmsford<br />
                Essex CM2 9BP
              </address>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:items-center">
            <div className="w-full md:w-auto">
              <h3 className="text-lg font-semibold text-foreground mb-4"><span className="border-b-2 border-[#3a9ca5]/40 pb-1">Useful Links</span></h3>
              <ul className="flex flex-col gap-3">
                <li><Link href="/page/policy" className="text-muted-foreground hover:text-primary transition-colors text-sm">App Privacy Notice</Link></li>
                <li><Link href="/cookies" className="text-muted-foreground hover:text-primary transition-colors text-sm">Cookies</Link></li>
                <li><Link href="/shop" className="text-muted-foreground hover:text-primary transition-colors text-sm">Shop</Link></li>
                <li><Link href="/page/about" className="text-muted-foreground hover:text-primary transition-colors text-sm">About Us</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact Us</Link></li>
                <li><Link href="/page/copyright-and-licenses" className="text-muted-foreground hover:text-primary transition-colors text-sm">Copyright & Licenses</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4"><span className="border-b-2 border-[#3a9ca5]/40 pb-1">Follow Us</span></h3>
              <div className="flex items-center gap-4">
                <a href="https://www.youtube.com/@RhythmstixMusicForEducation" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                  <Youtube size={20} />
                </a>
                <a href="https://uk.linkedin.com/in/robert-reich-storer-974449144" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                  <Linkedin size={18} />
                </a>
                <a href="https://www.facebook.com/rhythmstix" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                  <Facebook size={20} />
                </a>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-muted-foreground text-sm">
            <span className="font-bold text-foreground/80">rhythm<span className="text-[#3a9ca5]">stix</span></span>
            <span>© 2021</span>
          </div>
          <p className="text-xs text-muted-foreground/60">
            Designed for education.
          </p>
        </div>
      </div>
    </footer>
  );
}
