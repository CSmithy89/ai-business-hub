'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  Bell,
  Archive,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'assignment' | 'notification' | 'lifecycle' | 'escalation';
  icon: string;
  definition: any;
}

interface WorkflowTemplateGalleryProps {
  templates: WorkflowTemplate[];
  onSelectTemplate: (template: WorkflowTemplate) => void;
}

const categoryLabels = {
  assignment: 'Assignment',
  notification: 'Notification',
  lifecycle: 'Lifecycle',
  escalation: 'Escalation',
};

const iconMap: Record<string, React.ReactNode> = {
  'user-plus': <UserPlus className="w-6 h-6" />,
  'bell': <Bell className="w-6 h-6" />,
  'archive': <Archive className="w-6 h-6" />,
  'alert-triangle': <AlertTriangle className="w-6 h-6" />,
  'arrow-right': <ArrowRight className="w-6 h-6" />,
};

export function WorkflowTemplateGallery({
  templates,
  onSelectTemplate,
}: WorkflowTemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  const getCategoryBadge = (category: string) => {
    const colors = {
      assignment: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      notification: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      lifecycle: 'bg-green-500/10 text-green-500 border-green-500/20',
      escalation: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/10 text-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Workflow Templates</h2>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="assignment">Assignment</TabsTrigger>
          <TabsTrigger value="notification">Notification</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
          <TabsTrigger value="escalation">Escalation</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <p className="text-muted-foreground">No templates in this category</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {iconMap[template.icon] || <Sparkles className="w-6 h-6" />}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={getCategoryBadge(template.category)}
                  >
                    {categoryLabels[template.category]}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription>{template.description}</CardDescription>

                  <div className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{template.definition.nodes?.length || 0} nodes</span>
                      <span>•</span>
                      <span>{template.definition.edges?.length || 0} connections</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => onSelectTemplate(template)}
                    className="w-full"
                    variant="default"
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
