/**
 * Step 3: Meet Your AI Team Component
 *
 * Third step of account onboarding wizard.
 * Introduces users to the AI agents that will help them.
 *
 * Story: 15.3 - Implement 4-Step User Onboarding Wizard
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Target, Users, Compass, Sparkles, BarChart3 } from 'lucide-react';

const AI_TEAM = [
  {
    name: 'Hub',
    role: 'Your Orchestrator',
    icon: Target,
    color: 'bg-coral text-white',
    description: 'Coordinates all your agents and routes tasks to the right specialist.',
  },
  {
    name: 'Maya',
    role: 'CRM & Relationships',
    icon: Users,
    color: 'bg-teal-500 text-white',
    description: 'Manages contacts, tracks interactions, and nurtures customer relationships.',
  },
  {
    name: 'Atlas',
    role: 'Projects & Tasks',
    icon: Compass,
    color: 'bg-blue-500 text-white',
    description: 'Organizes projects, assigns tasks, and tracks progress across your team.',
  },
  {
    name: 'Nova',
    role: 'Marketing & Content',
    icon: Sparkles,
    color: 'bg-purple-500 text-white',
    description: 'Creates content, manages campaigns, and handles your marketing automation.',
  },
  {
    name: 'Echo',
    role: 'Analytics & Insights',
    icon: BarChart3,
    color: 'bg-green-500 text-white',
    description: 'Analyzes data, generates reports, and surfaces actionable insights.',
  },
];

interface StepAiTeamProps {
  onContinue: () => void;
  onBack: () => void;
}

export function StepAiTeam({ onContinue, onBack }: StepAiTeamProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">Meet Your AI Team</h2>
        <p className="mt-2 text-muted-foreground">
          These agents will handle 90% of your operations, so you can focus on what matters.
        </p>
      </div>

      {/* Agent Cards */}
      <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AI_TEAM.map((agent) => {
          const Icon = agent.icon;

          return (
            <Card key={agent.name} className="transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${agent.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground">{agent.role}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{agent.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Highlight Box */}
      <div className="mx-auto max-w-lg rounded-lg bg-gradient-to-r from-primary/10 to-coral/10 p-6 text-center">
        <p className="text-lg font-medium">
          <span className="text-primary">90% automation</span> with just{' '}
          <span className="text-coral">~5 hours/week</span> of your time
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your AI team works 24/7, handling routine tasks while you make the big decisions.
        </p>
      </div>

      {/* Navigation */}
      <div className="mx-auto flex max-w-lg items-center justify-between gap-4 pt-4">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Button onClick={onContinue} size="lg">
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
