import { Link } from "wouter";
import { Youtube, Linkedin, Facebook, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-16 pb-8 relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Contact Us */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
              Contact Us
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

          {/* Useful Links */}
          <div className="flex flex-col gap-4 md:items-center">
            <div className="w-full md:w-auto">
              <h3 className="text-lg font-semibold text-foreground mb-4">Useful Links</h3>
              <ul className="flex flex-col gap-3">
                <li><a href="#privacy" className="text-muted-foreground hover:text-primary transition-colors text-sm">App Privacy Notice</a></li>
                <li><a href="#cookies" className="text-muted-foreground hover:text-primary transition-colors text-sm">Cookies</a></li>
                <li><a href="#downloads" className="text-muted-foreground hover:text-primary transition-colors text-sm">Software Downloads</a></li>
                <li><a href="#about" className="text-muted-foreground hover:text-primary transition-colors text-sm">About Us</a></li>
              </ul>
            </div>
          </div>

          {/* Follow Us */}
          <div className="flex flex-col gap-4 md:items-end">
            <div className="w-full md:w-auto">
              <h3 className="text-lg font-semibold text-foreground mb-4">Follow Us</h3>
              <div className="flex items-center gap-4">
                <a href="#youtube" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all shadow-sm">
                  <Youtube size={20} />
                </a>
                <a href="#linkedin" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all shadow-sm">
                  <Linkedin size={18} />
                </a>
                <a href="#facebook" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all shadow-sm">
                  <Facebook size={20} />
                </a>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center opacity-80">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
                <path d="m14.5 9.5-9 9" />
                <path d="m9.5 14.5 9-9" />
              </svg>
            </div>
            <span>© Rhythmstix 2021</span>
          </div>
          <p className="text-xs text-muted-foreground/60">
            Designed for performing arts education.
          </p>
        </div>
      </div>
    </footer>
  );
}
