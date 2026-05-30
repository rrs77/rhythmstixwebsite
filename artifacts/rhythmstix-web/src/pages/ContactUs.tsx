import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Mail, MapPin, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { EditableText } from "@/components/EditableText";
import { useContent } from "@/hooks/use-content";

const API_BASE = `${import.meta.env.BASE_URL}api`;

export default function ContactUs() {
  const { toast } = useToast();
  const { data: content } = useContent();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const email = content?.["footer_email"] || "info@rhythmstix.co.uk";
  const address = content?.["footer_address"] || "Rhythmstix Ltd, 33 Vicarage Road, Chelmsford, Essex CM2 9BP";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      subject: (form.elements.namedItem("subject") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Something went wrong.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Unable to send message. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              <EditableText contentKey="contact.heading" fallback="Contact Us" as="span" />
            </h1>
            <EditableText
              contentKey="contact.subheading"
              fallback="Have a question or need support? We'd love to hear from you."
              as="p"
              className="text-muted-foreground text-lg max-w-2xl"
            />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="md:col-span-2"
            >
              {submitted ? (
                <div className="rounded-2xl border border-border bg-card p-10 text-center">
                  <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Message Sent</h2>
                  <p className="text-muted-foreground mb-6">
                    Thank you for getting in touch. We'll respond as soon as possible.
                  </p>
                  <Button variant="outline" onClick={() => setSubmitted(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5"
                >
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="What's this about?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us how we can help..."
                      rows={6}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="w-full sm:w-auto bg-[#3a9ca5] hover:bg-[#2d8890] text-white disabled:opacity-60"
                  >
                    {loading ? (
                      "Sending..."
                    ) : (
                      <>
                        Send Message
                        <Send className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-semibold text-lg mb-4">
                  <EditableText contentKey="contact.contact_card_title" fallback="Get in Touch" as="span" />
                </h3>
                <div className="space-y-4">
                  <a
                    href={`mailto:${email}`}
                    className="flex items-start gap-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail size={18} className="mt-0.5 shrink-0 text-primary" />
                    <span>{email}</span>
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-semibold text-lg mb-4">
                  <EditableText contentKey="contact.address_card_title" fallback="Our Address" as="span" />
                </h3>
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin size={18} className="mt-1 shrink-0 text-primary" />
                  <address className="not-italic text-sm leading-relaxed whitespace-pre-line">
                    {address}
                  </address>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
