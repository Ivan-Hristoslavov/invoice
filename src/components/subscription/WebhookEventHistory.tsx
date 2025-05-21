"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CircleAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from 'next-auth/react';

interface WebhookEvent {
  id: string;
  eventType: string;
  eventId: string;
  status: string;
  payload: string;
  processedAt: string;
}

export function WebhookEventHistory() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const { data: session } = useSession();
  
  useEffect(() => {
    async function fetchWebhookEvents() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/webhooks/events');
        if (!response.ok) {
          throw new Error('Failed to fetch webhook events');
        }
        const data = await response.json();
        setEvents(data.events);
      } catch (err: any) {
        console.error('Error fetching webhook events:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchWebhookEvents();
  }, []);
  
  // Filter events by type or id
  const filteredEvents = events.filter(event => 
    event.eventType.toLowerCase().includes(filter.toLowerCase()) ||
    event.eventId.toLowerCase().includes(filter.toLowerCase())
  );
  
  if (isLoading) {
    return <WebhookHistorySkeleton />;
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>История на Webhook събитията</CardTitle>
          <CardDescription>
            Възникна грешка при зареждането на събитията
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-destructive">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>История на Webhook събитията</CardTitle>
          <CardDescription>
            Все още няма записани webhook събития
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>История на Webhook събитията</CardTitle>
        <CardDescription>
          Всички входящи Stripe webhook събития и техният статус
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Филтрирай по тип или ID на събитие"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата и час</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>ID на събитие</TableHead>
                <TableHead className="text-right">Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    {new Date(event.processedAt).toLocaleString('bg-BG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{event.eventType}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{event.eventId}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <WebhookStatusBadge status={event.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function WebhookStatusBadge({ status }: { status: string }) {
  const isSuccess = status === 'SUCCESS';
  
  return (
    <Badge variant={isSuccess ? 'default' : 'destructive'} className="flex items-center gap-1">
      {isSuccess ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <CircleAlert className="h-3 w-3" />
      )}
      {isSuccess ? 'Успешно' : 'Грешка'}
    </Badge>
  );
}

function WebhookHistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-[200px] mb-2" />
        <Skeleton className="h-4 w-[300px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full mb-6" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
} 