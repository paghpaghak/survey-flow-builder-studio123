import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import SurveyEditor from "./pages/SurveyEditor";
import NotFound from "./pages/NotFound";
import SurveyView from '@/pages/SurveyView';
import { TakeSurvey } from '@/pages/TakeSurvey';
import { ThankYou } from '@/pages/ThankYou';
import { SurveyResults } from '@/pages/SurveyResults';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/surveys/:id/edit" element={<SurveyEditor />} />
          <Route path="/surveys/:id/view" element={<SurveyView />} />
          <Route path="/take/:surveyId" element={<TakeSurvey />} />
          <Route path="/surveys/:surveyId/thank-you" element={<ThankYou />} />
          <Route path="/surveys/:surveyId/results" element={<SurveyResults />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
