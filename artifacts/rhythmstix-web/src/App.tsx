import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import WPPage from "@/pages/WPPage";
import BlogList from "@/pages/BlogList";
import BlogPost from "@/pages/BlogPost";
import CCDesigner from "@/pages/CCDesigner";
import Resources from "@/pages/Resources";
import Shop from "@/pages/Shop";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/ccdesigner" component={CCDesigner} />
      <Route path="/resources" component={Resources} />
      <Route path="/shop" component={Shop} />
      <Route path="/blog" component={BlogList} />
      <Route path="/post/:slug" component={BlogPost} />
      <Route path="/page/:slug" component={WPPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
