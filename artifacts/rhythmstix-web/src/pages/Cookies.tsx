import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";

export default function Cookies() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-6">Cookie Declaration</h1>

            <div className="prose prose-lg max-w-none text-foreground space-y-8">
              <section>
                <h2 className="text-2xl font-bold mt-8 mb-4">What Are Cookies?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently, as well as to provide information to the owners of the site.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mt-8 mb-4">How We Use Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Rhythmstix uses cookies and similar technologies on this website for the following purposes:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-[#3a9ca5] font-bold mt-0.5">•</span>
                    <span>To ensure the website functions correctly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3a9ca5] font-bold mt-0.5">•</span>
                    <span>To remember your cookie preferences</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3a9ca5] font-bold mt-0.5">•</span>
                    <span>To improve site performance and user experience</span>
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mt-8 mb-4">Types of Cookies We Use</h2>

                <div className="bg-card rounded-2xl border border-border p-6 mb-4">
                  <h3 className="text-lg font-semibold mb-2">Essential Cookies</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions you take, such as setting your privacy preferences or logging in.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-secondary">
                          <th className="text-left p-3 font-semibold border border-border">Cookie</th>
                          <th className="text-left p-3 font-semibold border border-border">Purpose</th>
                          <th className="text-left p-3 font-semibold border border-border">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr>
                          <td className="p-3 border border-border font-mono text-xs">rhythmstix_cookie_consent</td>
                          <td className="p-3 border border-border">Stores your cookie consent preference</td>
                          <td className="p-3 border border-border">Persistent</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6 mb-4">
                  <h3 className="text-lg font-semibold mb-2">Functional Cookies</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    These cookies enable the website to provide enhanced functionality and personalisation. They may be set by us or by third-party providers whose services we have added to our pages.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-secondary">
                          <th className="text-left p-3 font-semibold border border-border">Cookie</th>
                          <th className="text-left p-3 font-semibold border border-border">Purpose</th>
                          <th className="text-left p-3 font-semibold border border-border">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr>
                          <td className="p-3 border border-border font-mono text-xs">connect.sid</td>
                          <td className="p-3 border border-border">Session identifier for logged-in users</td>
                          <td className="p-3 border border-border">24 hours</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="text-lg font-semibold mb-2">Third-Party Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    Some pages on this site may include content from third-party services (such as embedded videos or social media links) which may set their own cookies. We do not control these cookies. Please refer to the relevant third-party website for more information about their cookies.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mt-8 mb-4">Managing Your Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You can control and manage cookies in several ways. Please note that removing or blocking cookies may impact your user experience and parts of this website may no longer be fully accessible.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Most browsers allow you to refuse or accept cookies through their settings. The following links provide information on how to modify cookie settings in popular browsers:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-[#3a9ca5] font-bold mt-0.5">•</span>
                    <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#3a9ca5] underline underline-offset-2">Google Chrome</a>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3a9ca5] font-bold mt-0.5">•</span>
                    <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-[#3a9ca5] underline underline-offset-2">Mozilla Firefox</a>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3a9ca5] font-bold mt-0.5">•</span>
                    <a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#3a9ca5] underline underline-offset-2">Safari</a>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3a9ca5] font-bold mt-0.5">•</span>
                    <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-[#3a9ca5] underline underline-offset-2">Microsoft Edge</a>
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about our use of cookies, please contact us at{" "}
                  <a href="mailto:info@rhythmstix.co.uk" className="text-[#3a9ca5] underline underline-offset-2">info@rhythmstix.co.uk</a>.
                </p>
              </section>

              <p className="text-sm text-muted-foreground/60 mt-8">
                This cookie declaration was last updated on 30 March 2026.
              </p>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
