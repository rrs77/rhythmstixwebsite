import ProductPage from "./ProductPage";
import { Palette, BookOpen, Layers, Cloud, Smartphone, Users } from "lucide-react";

export default function CCDesigner() {
  return (
    <ProductPage
      name="CCDesigner"
      subtitle="Creative Curriculum Designer"
      icon={Palette}
      description={[
        "CCDesigner is a web app for planning and organising music and creative curriculum content for early years and primary settings. It helps teachers map lessons and activities to EYFS, KS1, and KS2 — including structures like LKG, UKG, Reception, and year groups you define in settings — so planning stays coherent across classes and terms.",
        "The app centres on a lesson library and activity workflow: you can structure work by half-terms, units, categories, and year groups, attach rich descriptions and standards where you use them, and manage activity details such as timings, levels, and resource links — for example video, audio, scores, and lyrics. Data is stored and synced via cloud storage so teams can work from different devices; it is also set up with PWA-style behaviour so it can feel more app-like and remain usable when connectivity is patchy.",
        "It was designed so those moments of inspiration that are often forgotten in a lesson can be captured and reused — so a good idea on Tuesday is still there when you plan again next week or next year. In short, CCDesigner is a single place to design, store, and reuse curriculum-ready lesson and activity content rather than scattering it across documents and spreadsheets.",
      ]}
      features={[
        { icon: BookOpen, title: "Lesson Library", description: "Build a structured library of lessons and activities organised by half-terms, units, categories, and year groups. Every good idea is captured and ready to reuse." },
        { icon: Layers, title: "Curriculum Mapping", description: "Map lessons and activities to EYFS, KS1, and KS2 frameworks — including LKG, UKG, Reception, and custom year groups you define in settings." },
        { icon: Cloud, title: "Cloud Sync", description: "Data is stored and synced via cloud storage so teams can work from different devices. Changes made by one colleague are available to everyone." },
        { icon: Smartphone, title: "PWA-Ready", description: "Built with PWA-style behaviour so it feels app-like on any device and remains usable even when connectivity is patchy." },
        { icon: Users, title: "Team Collaboration", description: "Designed for curriculum teams who need consistent naming and structure without losing flexibility. Admin tools let you set custom year groups, categories, and branding." },
        { icon: Palette, title: "White-Label Branding", description: "Optional white-label support — customise logos, titles, footer content, and social links to match your school or trust's identity." },
      ]}
      pros={[
        "Single place to design, store, and reuse curriculum-ready content",
        "Structured by half-terms, units, categories, and year groups",
        "Rich activity details: timings, levels, resource links (video, audio, scores, lyrics)",
        "Cloud-synced so teams can collaborate across devices",
        "PWA behaviour — works offline and feels native on tablets",
        "Captures lesson inspiration so good ideas aren't forgotten",
        "Admin controls for custom year groups, categories, and branding",
        "Maps directly to EYFS, KS1, and KS2 curriculum frameworks",
        "Replaces scattered documents and spreadsheets with one coherent system",
        "White-label ready for multi-academy trusts and music hubs",
      ]}
      considerations={[
        "Requires initial setup time to structure your year groups and categories",
        "Best suited for music and creative arts — may need adaptation for other subjects",
        "Cloud sync requires internet for initial data load",
        "Team features work best when all staff adopt the platform together",
      ]}
      ctaHeading="Ready to streamline your curriculum planning?"
      ctaText="Stop scattering lesson plans across documents and spreadsheets. CCDesigner gives you one coherent system to design, store, and reuse your best creative curriculum content."
      externalUrl="https://www.ccdesigner.co.uk/"
      externalLabel="Visit CCDesigner"
    />
  );
}
