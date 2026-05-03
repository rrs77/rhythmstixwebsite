import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import WPPage from "@/pages/WPPage";
import WPSlug from "@/pages/WPSlug";
import BlogList from "@/pages/BlogList";
import BlogPost from "@/pages/BlogPost";
import CCDesigner from "@/pages/CCDesigner";
import Assessify from "@/pages/Assessify";
import PeriFeedback from "@/pages/PeriFeedback";
import ProgressPath from "@/pages/ProgressPath";
import RhythmstixApp from "@/pages/RhythmstixApp";
import ELearning from "@/pages/ELearning";

import Community from "@/pages/Community";
import ContactUs from "@/pages/ContactUs";
import Cookies from "@/pages/Cookies";
import Shop from "@/pages/Shop";
import ShopProduct from "@/pages/ShopProduct";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";
import { CookieConsent } from "@/components/CookieConsent";
import { AdminBar } from "@/components/AdminBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/assessify" component={Assessify} />
      <Route path="/ccdesigner" component={CCDesigner} />
      <Route path="/perifeedback" component={PeriFeedback} />
      <Route path="/progresspath" component={ProgressPath} />
      <Route path="/rhythmstix-app" component={RhythmstixApp} />
      <Route path="/app" component={RhythmstixApp} />
      <Route path="/elearning" component={ELearning} />

      <Route path="/community" component={Community} />
      <Route path="/contact" component={ContactUs} />
      <Route path="/cookies" component={Cookies} />
      <Route path="/shop" component={Shop} />
      <Route path="/shop/:familyId" component={ShopProduct} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/account">
        <ProtectedRoute require="user">
          <Account />
        </ProtectedRoute>
      </Route>
      <Route path="/admin" component={Admin} />
      <Route path="/blog" component={BlogList} />
      <Route path="/post/:slug" component={BlogPost} />
      <Route path="/page/:slug" component={WPPage} />
      <Route path="/:slug" component={WPSlug} />
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
          <CookieConsent />
          <AdminBar />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
