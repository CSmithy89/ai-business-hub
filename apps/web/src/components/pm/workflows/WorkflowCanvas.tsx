'use client';

import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  NodeTypes,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { WorkflowDefinition } from '@hyvve/shared';
import { TriggerNode } from './nodes/TriggerNode';
import { ConditionNode } from './nodes/ConditionNode';
import { ActionNode } from './nodes/ActionNode';
import { AgentNode } from './nodes/AgentNode';
import { NodePalette } from './NodePalette';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface WorkflowCanvasProps {
  workflowId?: string;
  definition: WorkflowDefinition;
  onSave: (definition: WorkflowDefinition) => void;
  readOnly?: boolean;
}

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
  agent: AgentNode,
};

export function WorkflowCanvas({ definition, onSave, readOnly = false }: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(definition.nodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(definition.edges as Edge[]);
  const [nodeIdCounter, setNodeIdCounter] = useState(definition.nodes.length);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const handleAddNode = useCallback(
    (nodeType: string, data: { label: string; config: any }) => {
      const newNodeId = `node-${nodeIdCounter + 1}`;
      setNodeIdCounter((prev) => prev + 1);

      const newNode: Node = {
        id: newNodeId,
        type: nodeType,
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
        data,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [nodeIdCounter, setNodes]
  );

  const handleSave = useCallback(() => {
    const updatedDefinition: WorkflowDefinition = {
      ...definition,
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type as 'trigger' | 'condition' | 'action' | 'agent',
        position: node.position,
        data: node.data,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label as string | undefined,
      })),
    };

    onSave(updatedDefinition);
  }, [nodes, edges, definition, onSave]);

  return (
    <div className="flex h-full w-full">
      {!readOnly && <NodePalette onAddNode={handleAddNode} />}

      <div className="flex-1 relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {!readOnly && (
            <Button onClick={handleSave} size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save Workflow
            </Button>
          )}
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          fitView
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'trigger':
                  return '#22c55e';
                case 'condition':
                  return '#f59e0b';
                case 'action':
                  return '#3b82f6';
                case 'agent':
                  return '#a855f7';
                default:
                  return '#6b7280';
              }
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
