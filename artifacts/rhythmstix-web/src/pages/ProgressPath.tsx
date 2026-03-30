import ProductPage from "./ProductPage";
import { TrendingUp, Map, GitBranch, Target, Eye, Layers } from "lucide-react";

export default function ProgressPath() {
  return (
    <ProductPage
      name="ProgressPath"
      subtitle="Visualise Student Learning Journeys"
      icon={TrendingUp}
      description={[
        "ProgressPath helps teachers and curriculum leaders visualise student learning journeys from early years through to advanced levels. Instead of tracking progress in isolated spreadsheets, ProgressPath maps out clear progression routes so you can see where students are, where they're heading, and what steps come next.",
        "The tool is designed around the idea that learning isn't linear — students develop at different rates across different skills. ProgressPath lets you define progression pathways for your subject area, map student achievement against those pathways, and identify gaps or areas where students need additional support.",
        "Whether you're tracking progression across a single year group or mapping long-term development from Reception to Year 6, ProgressPath gives you a clear, visual overview that makes curriculum planning and student support more intentional and informed.",
      ]}
      features={[
        { icon: Map, title: "Progression Maps", description: "Define clear progression pathways for your subject. Map out what mastery looks like at each stage from early years to advanced levels." },
        { icon: GitBranch, title: "Flexible Pathways", description: "Learning isn't linear. Create branching pathways that reflect how students actually develop across different skills and competencies." },
        { icon: Target, title: "Gap Analysis", description: "Identify where students are falling behind or excelling. Target support and enrichment where it's needed most." },
        { icon: Eye, title: "Visual Overview", description: "See student progress at a glance with clear, visual progression maps. No more deciphering complex spreadsheets." },
        { icon: Layers, title: "Multi-Year Tracking", description: "Track development from Reception to Year 6 and beyond. Build a long-term picture of student achievement." },
        { icon: TrendingUp, title: "Progress Reports", description: "Generate progress reports that show where students sit on their progression pathway. Clear, visual, and easy to understand." },
      ]}
      pros={[
        "Visual progression maps make student journeys clear",
        "Supports non-linear learning pathways",
        "Gap analysis identifies students who need support",
        "Long-term tracking across multiple year groups",
        "Helps curriculum leaders plan more intentionally",
        "Clear reports for parents and leadership",
        "Replaces complex spreadsheets with intuitive visuals",
        "Designed for music and creative subjects",
      ]}
      considerations={[
        "Requires initial effort to define progression pathways",
        "Most effective when used consistently across a department",
        "Pathway definitions should be reviewed and updated periodically",
        "Best suited for subjects with clear skill progressions",
      ]}
      ctaHeading="Map out clearer learning journeys"
      ctaText="ProgressPath gives teachers and curriculum leaders a visual, intuitive way to track student progression — so no one gets lost along the way."
    />
  );
}
