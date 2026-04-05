import ProductPage from "./ProductPage";
import { GraduationCap, Monitor, BookOpen, Award, Users, Layers } from "lucide-react";

export default function ELearning() {
  return (
    <ProductPage
      name="Teaching Portal"
      subtitle="Comprehensive Digital Courses & Resources"
      icon={GraduationCap}
      description={[
        "The Rhythmstix Teaching Portal delivers comprehensive digital courses, resources, and interactive modules designed for modern music education. It provides schools with structured, curriculum-aligned content that teachers can use directly or adapt to their own schemes of work.",
        "The platform includes differentiated music lessons complete with multimedia content — video demonstrations, audio examples, quizzes, and straightforward assessments. Lessons are designed to support both specialist music teachers and non-specialists who need high-quality, ready-to-teach resources.",
        "Content is delivered through the Rhythmstix Learning Platform, accessible through a browser-based app on any device. Schools get a year's access for an unlimited number of users, making it excellent value for whole-school music provision.",
      ]}
      features={[
        { icon: Monitor, title: "Interactive Lessons", description: "Differentiated music lessons with multimedia content — video, audio, quizzes, and assessments. Ready to teach or adapt to your scheme of work." },
        { icon: BookOpen, title: "Curriculum-Aligned", description: "Content aligned to UK music curriculum requirements. Structured by key stage and year group for easy integration into your planning." },
        { icon: Layers, title: "Differentiated Content", description: "Lessons designed with differentiation built in. Support all learners from beginners to more advanced students within the same lesson." },
        { icon: Award, title: "Built-In Assessment", description: "Straightforward assessments delivered within the platform. Track student understanding without creating separate assessment materials." },
        { icon: Users, title: "Unlimited Users", description: "School-wide access with no per-user limits. Every teacher and student in your school can access the platform with a single subscription." },
        { icon: GraduationCap, title: "Non-Specialist Friendly", description: "Designed so non-specialist teachers can deliver high-quality music lessons confidently. Detailed guidance and multimedia support included." },
      ]}
      pros={[
        "Ready-to-teach differentiated music lessons",
        "Multimedia content — video, audio, quizzes, and assessments",
        "Supports both specialist and non-specialist teachers",
        "Unlimited users per school — excellent value",
        "Accessible through a browser-based app",
        "Curriculum-aligned to UK requirements",
        "Built-in assessment saves separate tracking",
        "Structured by key stage and year group",
      ]}
      considerations={[
        "Requires internet access for platform use",
        "Annual subscription model",
        "Content focused on music education specifically",
        "Works best when integrated into existing schemes of work",
      ]}
      ctaHeading="Quality music education for every classroom"
      ctaText="The Teaching Portal gives schools comprehensive, ready-to-teach music resources that work for specialists and non-specialists alike."
      externalUrl="https://app.rhythmstix.co.uk/"
      externalLabel="Visit Teaching Portal"
    />
  );
}
