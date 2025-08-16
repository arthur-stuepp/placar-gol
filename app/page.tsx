"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, Settings, History, Plus, Minus } from "lucide-react"

interface Match {
  id: string
  team1: string
  team2: string
  score1: number
  score2: number
  duration: number
  date: string
}

export default function FootballScoreboard() {
  // Estados do placar
  const [team1Name, setTeam1Name] = useState("Time A")
  const [team2Name, setTeam2Name] = useState("Time B")
  const [score1, setScore1] = useState(0)
  const [score2, setScore2] = useState(0)

  // Estados do tempo
  const [matchDuration, setMatchDuration] = useState(90) // minutos
  const [currentTime, setCurrentTime] = useState(0) // segundos
  const [isRunning, setIsRunning] = useState(false)
  const [extraTime, setExtraTime] = useState(0) // acréscimos em segundos

  // Estados dos diálogos
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Histórico de partidas
  const [matches, setMatches] = useState<Match[]>([])

  // Referência para o áudio do alarme
  const audioRef = useRef<HTMLAudioElement>(null)

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 1
          const totalMatchTime = matchDuration * 60 + extraTime

          // Tocar alarme quando o tempo acabar
          if (newTime >= totalMatchTime) {
            setIsRunning(false)
            playAlarm()
          }

          return newTime
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, matchDuration, extraTime])

  // Função para tocar o alarme
  const playAlarm = () => {
    // Criar um beep usando Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = "sine"

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 1)
  }

  // Funções de controle do placar
  const addGoal = (team: 1 | 2) => {
    if (team === 1) setScore1((prev) => prev + 1)
    else setScore2((prev) => prev + 1)
  }

  const removeGoal = (team: 1 | 2) => {
    if (team === 1) setScore1((prev) => Math.max(0, prev - 1))
    else setScore2((prev) => Math.max(0, prev - 1))
  }

  // Funções de controle do tempo
  const toggleTimer = () => setIsRunning(!isRunning)

  const addExtraTime = (seconds: number) => {
    setExtraTime((prev) => Math.max(0, prev + seconds))
  }

  // Função para iniciar nova partida
  const startNewMatch = () => {
    // Salvar partida atual no histórico se houver gols
    if (score1 > 0 || score2 > 0) {
      const newMatch: Match = {
        id: Date.now().toString(),
        team1: team1Name,
        team2: team2Name,
        score1,
        score2,
        duration: Math.floor(currentTime / 60),
        date: new Date().toLocaleDateString("pt-BR"),
      }
      setMatches((prev) => [newMatch, ...prev])
    }

    // Reset todos os valores
    setScore1(0)
    setScore2(0)
    setCurrentTime(0)
    setIsRunning(false)
    setExtraTime(0)
  }

  // Formatação do tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const totalMatchTime = matchDuration * 60 + extraTime
  const timeLeft = Math.max(0, totalMatchTime - currentTime)
  const isOvertime = currentTime > matchDuration * 60

  return (
    <div className="min-h-screen bg-green-600 p-4 flex items-center justify-center">
      <div className="w-full max-w-6xl">
        {/* Header com controles */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configurações da Partida</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nome do Time 1</label>
                    <Input value={team1Name} onChange={(e) => setTeam1Name(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nome do Time 2</label>
                    <Input value={team2Name} onChange={(e) => setTeam2Name(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duração da Partida (minutos)</label>
                    <Input
                      type="number"
                      value={matchDuration}
                      onChange={(e) => setMatchDuration(Number(e.target.value))}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showHistory} onOpenChange={setShowHistory}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Histórico de Partidas</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {matches.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Nenhuma partida registrada</p>
                  ) : (
                    matches.map((match) => (
                      <Card key={match.id} className="p-3">
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            <div className="font-medium">
                              {match.team1} vs {match.team2}
                            </div>
                            <div className="text-muted-foreground">{match.date}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {match.score1} - {match.score2}
                            </div>
                            <div className="text-xs text-muted-foreground">{match.duration} min</div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Button onClick={startNewMatch} variant="destructive">
            <RotateCcw className="w-4 h-4 mr-2" />
            Nova Partida
          </Button>
        </div>

        {/* Placar Principal */}
        <Card className="p-8 mb-6">
          <div className="grid grid-cols-3 gap-8 items-center">
            {/* Time 1 */}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">{team1Name}</h2>
              <div className="text-8xl font-bold mb-6 text-blue-600">{score1}</div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => addGoal(1)} size="lg" className="h-16 text-xl">
                  <Plus className="w-6 h-6 mr-2" />
                  GOL
                </Button>
                <Button onClick={() => removeGoal(1)} variant="outline" size="sm">
                  <Minus className="w-4 h-4 mr-1" />
                  Remover
                </Button>
              </div>
            </div>

            {/* Tempo Central */}
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">{formatTime(currentTime)}</div>
              {isOvertime && (
                <Badge variant="destructive" className="mb-2">
                  Acréscimos: +{Math.floor((currentTime - matchDuration * 60) / 60)}'
                </Badge>
              )}
              <div className="text-lg text-muted-foreground mb-4">Restam: {formatTime(timeLeft)}</div>

              <div className="flex justify-center gap-2 mb-4">
                <Button onClick={toggleTimer} size="lg">
                  {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
              </div>

              <div className="flex justify-center gap-1">
                <Button onClick={() => addExtraTime(60)} variant="outline" size="sm">
                  +1min
                </Button>
                <Button onClick={() => addExtraTime(300)} variant="outline" size="sm">
                  +5min
                </Button>
                <Button onClick={() => addExtraTime(-60)} variant="outline" size="sm">
                  -1min
                </Button>
              </div>
            </div>

            {/* Time 2 */}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">{team2Name}</h2>
              <div className="text-8xl font-bold mb-6 text-red-600">{score2}</div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => addGoal(2)} size="lg" className="h-16 text-xl">
                  <Plus className="w-6 h-6 mr-2" />
                  GOL
                </Button>
                <Button onClick={() => removeGoal(2)} variant="outline" size="sm">
                  <Minus className="w-4 h-4 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Indicador de fim de jogo */}
        {currentTime >= totalMatchTime && (
          <Card className="p-4 bg-red-100 border-red-300">
            <div className="text-center">
              <h3 className="text-xl font-bold text-red-800">🚨 TEMPO ESGOTADO! 🚨</h3>
              <p className="text-red-700">A partida chegou ao fim!</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
