import { Music, GraduationCap } from "lucide-react";

export function AppCreator() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
          <span className="text-[rgb(52,154,167)]">App Creator</span>
        </h2>

        <div className="bg-card rounded-2xl border border-border p-8 md:p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3a9ca5] to-[#2d8890] flex items-center justify-center text-white">
              <Music size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Rob</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <GraduationCap size={14} className="text-primary" />
                Composer & Specialist Teacher
              </p>
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            Rob graduated from Birmingham University with a Degree in Drama and Theatre Arts.
            Following many years as a teacher in Primary and Secondary settings, he is now a
            composer and specialist teacher. As the Head Of Music and Drama at an independent
            school in Essex, teaching children from 2 – 16, he is always around music and loves
            composing for schools and creating inspiring learning for children. He lives in
            Chelmsford Essex with his wife, 2 children and 2 cats – Georgie and Ira.
          </p>
        </div>
      </div>
    </section>
  );
}
