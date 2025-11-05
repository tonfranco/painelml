"use client";

import { useEffect, useState } from "react";
import { MessageCircle, RefreshCw, Send, Mail, MailOpen, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loading } from "@/components/ui/loading";
import { useConversations, useMessagesStats, useSendMessage, useSyncMessages } from "@/hooks/useMessages";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Conversation, Message } from "@/types";

export default function MessagesPage() {
  const [accountId, setAccountId] = useState<string>("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("accountId");
    if (id) {
      setAccountId(id);
    }
  }, []);

  const { data: conversations = [], isLoading, refetch } = useConversations(accountId);
  const { data: stats } = useMessagesStats(accountId);
  const syncMutation = useSyncMessages(accountId);
  const sendMutation = useSendMessage(accountId);

  const handleSync = async () => {
    setSyncMessage(null);
    try {
      const result = await syncMutation.mutateAsync();
      setSyncMessage({
        type: 'success',
        text: result.message || `${result.count} mensagens sincronizadas com sucesso!`
      });
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (error: any) {
      setSyncMessage({
        type: 'error',
        text: error.message || 'Erro ao sincronizar mensagens'
      });
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedConversation?.packId) return;
    
    try {
      await sendMutation.mutateAsync({
        packId: selectedConversation.packId,
        text: replyText,
      });
      setReplyText("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  if (!accountId) {
    return (
      <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 dark:to-gray-900">
        <CardContent className="flex items-center gap-3 p-6">
          <div className="rounded-lg bg-amber-500 p-3">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              Nenhuma conta conectada
            </p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Conecte uma conta do Mercado Livre para visualizar as mensagens.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mensagens
          </h1>
          <p className="mt-1 text-lg text-gray-700 dark:text-gray-300">
            Gerencie as mensagens dos seus clientes
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleSync}
          disabled={syncMutation.isPending}
          size="sm"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          Sincronizar
        </Button>
      </div>

      {/* Sync Message */}
      {syncMessage && (
        <Card className={`mb-6 border-l-4 ${
          syncMessage.type === 'success' 
            ? 'border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900'
            : 'border-l-red-500 bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-gray-900'
        }`}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`rounded-lg p-2 ${
              syncMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {syncMessage.type === 'success' ? (
                <MessageCircle className="h-5 w-5 text-white" />
              ) : (
                <AlertCircle className="h-5 w-5 text-white" />
              )}
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {syncMessage.text}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Total
              </CardTitle>
              <div className="rounded-full bg-blue-500 p-2.5">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 dark:to-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Não Lidas
              </CardTitle>
              <div className="rounded-full bg-amber-500 p-2.5">
                <Mail className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.unread}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Lidas
              </CardTitle>
              <div className="rounded-full bg-green-500 p-2.5">
                <MailOpen className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.read}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conversations Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loading size="lg" className="text-blue-600" />
        </div>
      ) : conversations.length === 0 ? (
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900">
          <CardContent className="p-12 text-center">
            <MessageCircle className="mx-auto mb-4 h-12 w-12 text-blue-500" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              Nenhuma mensagem encontrada
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Clique em "Sincronizar" para buscar mensagens do Mercado Livre
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {conversations.map((conversation) => (
            <Card
              key={conversation.packId || 'no-pack'}
              className={`cursor-pointer border-l-4 transition-all hover:shadow-lg ${
                conversation.unreadCount > 0
                  ? "border-l-amber-500 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 dark:to-gray-900"
                  : "border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900"
              } ${selectedConversation?.packId === conversation.packId ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => setSelectedConversation(conversation)}
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="mb-3 flex items-center justify-between">
                  <Badge variant={conversation.unreadCount > 0 ? "warning" : "success"} className="font-semibold">
                    {conversation.unreadCount > 0 ? (
                      <>
                        <Mail className="mr-1 h-3 w-3" />
                        {conversation.unreadCount} não lida{conversation.unreadCount > 1 ? 's' : ''}
                      </>
                    ) : (
                      <>
                        <MailOpen className="mr-1 h-3 w-3" />
                        Lida
                      </>
                    )}
                  </Badge>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {formatDistanceToNow(new Date(conversation.lastMessageDate), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>

                {/* Last Message */}
                <div className="mb-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Última mensagem:</p>
                  <p className="line-clamp-2 text-base font-medium text-gray-900 dark:text-white">
                    {conversation.lastMessage}
                  </p>
                </div>

                {/* Message Count */}
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <MessageCircle className="h-3 w-3" />
                  <span>{conversation.messages.length} mensagem{conversation.messages.length > 1 ? 's' : ''}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Conversation Detail Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-3xl max-h-[80vh] overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Conversa</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                >
                  Fechar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages List */}
              <div className="max-h-96 overflow-y-auto p-6 space-y-4">
                {selectedConversation.messages.map((message: Message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.fromRole === 'seller' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        message.fromRole === 'seller'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
                      }`}
                    >
                      <p className="text-sm font-medium">{message.text}</p>
                      <p className="mt-1 text-xs opacity-70">
                        {formatDistanceToNow(new Date(message.dateCreated), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              {selectedConversation.packId && (
                <div className="border-t p-6">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Digite sua resposta..."
                      value={replyText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyText(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSendMessage}
                        disabled={!replyText.trim() || sendMutation.isPending}
                        className="bg-gradient-to-r from-blue-500 to-purple-500"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {sendMutation.isPending ? "Enviando..." : "Enviar"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
