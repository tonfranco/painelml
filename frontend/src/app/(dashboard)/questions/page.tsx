"use client";

import { useEffect, useState } from "react";
import { MessageCircle, RefreshCw, Send, CheckCircle, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loading } from "@/components/ui/loading";
import { useQuestions, useQuestionsStats, useAnswerQuestion } from "@/hooks/useQuestions";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Question } from "@/types";

export default function QuestionsPage() {
  const [accountId, setAccountId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [answeringQuestion, setAnsweringQuestion] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState<string>("");

  useEffect(() => {
    const id = localStorage.getItem("accountId");
    if (id) {
      setAccountId(id);
    }
  }, []);

  const { data: questions = [], isLoading, refetch } = useQuestions(accountId, statusFilter === "all" ? undefined : statusFilter);
  const { data: stats } = useQuestionsStats(accountId);
  const answerMutation = useAnswerQuestion(accountId);

  const handleAnswer = async (questionId: string) => {
    if (!answerText.trim()) return;
    
    try {
      await answerMutation.mutateAsync({ questionId, answer: answerText });
      setAnsweringQuestion(null);
      setAnswerText("");
    } catch (error) {
      console.error("Erro ao responder pergunta:", error);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "ANSWERED":
        return { label: "Respondida", variant: "success" as const, icon: CheckCircle, color: "text-green-500" };
      case "UNANSWERED":
        return { label: "Pendente", variant: "warning" as const, icon: Clock, color: "text-amber-500" };
      case "CLOSED_UNANSWERED":
        return { label: "Fechada", variant: "danger" as const, icon: AlertCircle, color: "text-red-500" };
      default:
        return { label: status, variant: "default" as const, icon: MessageCircle, color: "text-gray-500" };
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
              Conecte uma conta do Mercado Livre para visualizar as perguntas.
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
            Perguntas
          </h1>
          <p className="mt-1 text-lg text-gray-700 dark:text-gray-300">
            Gerencie as perguntas dos seus clientes
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          size="sm"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                Pendentes
              </CardTitle>
              <div className="rounded-full bg-amber-500 p-2.5">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.unanswered}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Respondidas
              </CardTitle>
              <div className="rounded-full bg-green-500 p-2.5">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.answered}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Fora do SLA
              </CardTitle>
              <div className="rounded-full bg-red-500 p-2.5">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.overdueSLA}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={statusFilter === "all" ? "primary" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("all")}
        >
          Todas
        </Button>
        <Button
          variant={statusFilter === "UNANSWERED" ? "primary" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("UNANSWERED")}
        >
          Pendentes
        </Button>
        <Button
          variant={statusFilter === "ANSWERED" ? "primary" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("ANSWERED")}
        >
          Respondidas
        </Button>
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loading size="lg" className="text-blue-600" />
        </div>
      ) : questions.length === 0 ? (
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900">
          <CardContent className="p-12 text-center">
            <MessageCircle className="mx-auto mb-4 h-12 w-12 text-blue-500" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              Nenhuma pergunta encontrada
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {questions.map((question: Question) => {
            const statusConfig = getStatusConfig(question.status);
            const StatusIcon = statusConfig.icon;
            const isAnswering = answeringQuestion === question.id;

            return (
              <Card
                key={question.id}
                className={`border-l-4 ${
                  question.status === "UNANSWERED"
                    ? "border-l-amber-500 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 dark:to-gray-900"
                    : "border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="mb-3 flex items-center gap-2">
                        <Badge variant={statusConfig.variant} className="font-semibold">
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDistanceToNow(new Date(question.dateCreated), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>

                      {/* Product Info */}
                      {question.item && (
                        <div className="mb-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Produto:</p>
                          {question.item.permalink ? (
                            <a
                              href={question.item.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                            >
                              {question.item.title}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {question.item.title}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Question */}
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pergunta:</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white">
                          {question.text}
                        </p>
                      </div>

                      {/* Answer */}
                      {question.answer && (
                        <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Resposta:</p>
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            {question.answer}
                          </p>
                          {question.dateAnswered && (
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                              Respondida{" "}
                              {formatDistanceToNow(new Date(question.dateAnswered), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Answer Form */}
                      {question.status === "UNANSWERED" && (
                        <div className="mt-4">
                          {isAnswering ? (
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Digite sua resposta..."
                                value={answerText}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnswerText(e.target.value)}
                                className="min-h-[100px]"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAnswer(question.id)}
                                  disabled={!answerText.trim() || answerMutation.isPending}
                                  className="bg-gradient-to-r from-green-500 to-green-600"
                                >
                                  <Send className="mr-2 h-4 w-4" />
                                  {answerMutation.isPending ? "Enviando..." : "Enviar Resposta"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAnsweringQuestion(null);
                                    setAnswerText("");
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setAnsweringQuestion(question.id)}
                              className="bg-gradient-to-r from-blue-500 to-purple-500"
                            >
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Responder
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
