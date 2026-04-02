'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const interviewTypes = ['Behavioral', 'Technical', 'System Design', 'Case Study']

const mockQuestions: Record<string, string[]> = {
  Behavioral: [
    'Tell me about a time you had to deal with a difficult team member. How did you handle the situation?',
    'Describe a project where you had to learn a new technology quickly. What was your approach?',
    'Give an example of a time you failed and what you learned from it.',
    'How do you prioritize tasks when you have multiple deadlines?',
    'Tell me about a time you went above and beyond for a project.',
  ],
  Technical: [
    'Explain the difference between REST and GraphQL. When would you choose one over the other?',
    'How would you design a caching strategy for a high-traffic web application?',
    'What is the difference between SQL and NoSQL databases? Give use cases for each.',
    'Explain how you would optimize a slow database query.',
    'Describe the concept of microservices and when you would use them.',
  ],
  'System Design': [
    'Design a URL shortening service like bit.ly. Walk me through the architecture.',
    'How would you design a real-time chat application that supports millions of users?',
    'Design a notification system that can handle email, SMS, and push notifications.',
    'How would you design a job search platform similar to LinkedIn Jobs?',
    'Design a file storage system like Google Drive or Dropbox.',
  ],
  'Case Study': [
    'Your e-commerce platform is experiencing a 30% drop in conversion rate. How would you investigate?',
    'A client wants to launch a new product in 3 months. How would you plan the technical roadmap?',
    'Your API response times have increased by 200%. Walk me through your debugging process.',
    'How would you migrate a monolithic application to microservices without downtime?',
    'Your team just inherited a legacy codebase with no tests. What is your plan of action?',
  ],
}

const feedbackTemplates = [
  { score: 8, strengths: ['Clear structure using STAR method', 'Specific metrics and outcomes', 'Good leadership demonstration'], improvements: ['Could elaborate on technical details', 'Mention team dynamics'], example: 'A stronger answer would start with the specific context, include metrics like "reduced deployment time by 40%", and conclude with what you learned.' },
  { score: 7, strengths: ['Good problem-solving approach', 'Showed self-awareness', 'Connected to role requirements'], improvements: ['Add quantifiable results', 'Be more concise in opening'], example: 'Try: "In my role at [Company], I faced [specific challenge]. I took [specific action] which resulted in [measurable outcome]."' },
  { score: 9, strengths: ['Excellent specific examples', 'Strong communication', 'Well-structured with clear takeaways'], improvements: ['Could mention alternative approaches considered'], example: 'This was strong. To make it perfect, briefly mention other approaches you considered and why you chose yours.' },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } } }

export default function InterviewCoachPage() {
  const [type, setType] = useState('Behavioral')
  const [mode, setMode] = useState<'setup' | 'interview' | 'review'>('setup')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [currentQ, setCurrentQ] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<typeof feedbackTemplates[0] | null>(null)
  const [timer, setTimer] = useState(120)
  const [timerActive, setTimerActive] = useState(false)
  const [scores, setScores] = useState<number[]>([])
  const [questions, setQuestions] = useState<string[]>([])
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    if (!timerActive || timer <= 0) return
    const t = setInterval(() => setTimer(v => v - 1), 1000)
    return () => clearInterval(t)
  }, [timerActive, timer])

  const startInterview = () => {
    const qs = mockQuestions[type] || mockQuestions.Behavioral
    setQuestions(qs)
    setCurrentQ(0)
    setScores([])
    setFeedback(null)
    setAnswer('')
    setTimer(120)
    setTimerActive(true)
    setMode('interview')
  }

  const submitAnswer = async () => {
    setTimerActive(false)
    setAnalyzing(true)
    await new Promise(r => setTimeout(r, 2000))
    const fb = feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)]
    setFeedback(fb)
    setScores([...scores, fb.score])
    setAnalyzing(false)
  }

  const nextQuestion = () => {
    if (currentQ >= questions.length - 1) { setMode('review'); return }
    setCurrentQ(currentQ + 1)
    setAnswer('')
    setFeedback(null)
    setTimer(120)
    setTimerActive(true)
  }

  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0'
  const timerPercent = (timer / 120) * 100
  const timerColor = timer > 60 ? '#00b894' : timer > 30 ? '#fdcb6e' : '#ff6b6b'

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-[1200px] mx-auto">

      {/* Header */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl p-8" style={{
        background: 'linear-gradient(135deg, rgba(162,155,254,0.08) 0%, rgba(253,121,168,0.06) 50%, rgba(0,184,148,0.04) 100%)',
        border: '1px solid rgba(162,155,254,0.1)',
      }}>
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #a29bfe, transparent 70%)' }} />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(162,155,254,0.15)' }}>
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a29bfe" strokeWidth="1.8"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </motion.div>
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight">AI Interview Coach</h1>
            <p className="text-[14px] text-[#8a8a9a] mt-1">Practice with AI-powered mock interviews and get instant feedback</p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {mode === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Interview Type */}
            <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, #12121a 0%, #0e0e16 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-[16px] font-bold mb-4">Interview Type</h3>
              <div className="flex flex-wrap gap-2">
                {interviewTypes.map(t => (
                  <button key={t} onClick={() => setType(t)} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300"
                    style={type === t ? { background: 'linear-gradient(135deg, rgba(162,155,254,0.15), rgba(253,121,168,0.1))', border: '1px solid rgba(162,155,254,0.3)', color: '#a29bfe', boxShadow: '0 0 20px rgba(162,155,254,0.1)' } : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#6a6a7a' }}>
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Company & Role */}
            <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, #12121a 0%, #0e0e16 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-[16px] font-bold mb-4">Customize Your Practice</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#6a6a7a] mb-2">Company (optional)</label>
                  <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g., Google, Meta"
                    className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[14px] placeholder-[#3a3a4a] focus:outline-none focus:border-[rgba(162,155,254,0.3)] transition-all" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#6a6a7a] mb-2">Role (optional)</label>
                  <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g., Senior Engineer"
                    className="w-full px-4 py-3 rounded-xl bg-[#16161f] border border-white/[0.06] text-white text-[14px] placeholder-[#3a3a4a] focus:outline-none focus:border-[rgba(162,155,254,0.3)] transition-all" />
                </div>
              </div>
            </motion.div>

            {/* Mode Cards */}
            <motion.div variants={fadeUp} className="grid sm:grid-cols-3 gap-4">
              {[
                { name: 'Quick Practice', time: '15 min', qs: '5 questions', color: '#00b894', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="5,3 19,12 5,21"/></svg> },
                { name: 'Full Interview', time: '45 min', qs: '15 questions', color: '#a29bfe', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> },
                { name: 'Company Specific', time: 'Custom', qs: 'Tailored', color: '#fd79a8', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
              ].map(m => (
                <motion.button key={m.name} whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startInterview}
                  className="p-6 rounded-2xl text-left group transition-all" style={{ background: `${m.color}06`, border: `1px solid ${m.color}15` }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${m.color}15`, color: m.color }}>{m.icon}</div>
                  <h4 className="text-[15px] font-bold text-white group-hover:text-[#fd79a8] transition-colors">{m.name}</h4>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${m.color}12`, color: m.color }}>{m.time}</span>
                    <span className="text-[11px] text-[#5a5a6a]">{m.qs}</span>
                  </div>
                </motion.button>
              ))}
            </motion.div>

            {/* STAR Method */}
            <motion.div variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(253,121,168,0.04), rgba(162,155,254,0.04))', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-[14px] font-bold mb-3 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fdcb6e" strokeWidth="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                Pro Tip: Use the STAR Method
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {[{ l: 'S', w: 'Situation', d: 'Set the scene' }, { l: 'T', w: 'Task', d: 'The challenge' }, { l: 'A', w: 'Action', d: 'What you did' }, { l: 'R', w: 'Result', d: 'The outcome' }].map(s => (
                  <div key={s.l} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="text-2xl font-black bg-gradient-to-r from-[#fd79a8] to-[#a29bfe] bg-clip-text text-transparent">{s.l}</div>
                    <div className="text-[11px] font-bold text-white mt-1">{s.w}</div>
                    <div className="text-[10px] text-[#5a5a6a] mt-0.5">{s.d}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {mode === 'interview' && (
          <motion.div key="interview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">

            {/* Progress dots */}
            <div className="flex items-center gap-3">
              {questions.map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: i < currentQ ? '100%' : i === currentQ ? '50%' : '0%' }}
                    className="h-full rounded-full" style={{ background: i < currentQ ? '#00b894' : '#a29bfe' }} />
                </div>
              ))}
              <span className="text-[12px] font-bold text-[#5a5a6a] shrink-0">{currentQ + 1}/{questions.length}</span>
            </div>

            {/* Question */}
            <div className="p-8 rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #12121a 0%, #0e0e16 100%)', border: '1px solid rgba(162,155,254,0.15)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #a29bfe, #fd79a8)' }} />
              <div className="flex items-center justify-between mb-6">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(162,155,254,0.1)', color: '#a29bfe' }}>Question {currentQ + 1}</span>
                <div className="flex items-center gap-2">
                  <svg width="32" height="32" className="transform -rotate-90">
                    <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                    <circle cx="16" cy="16" r="13" fill="none" stroke={timerColor} strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 13} strokeDashoffset={2 * Math.PI * 13 * (1 - timerPercent / 100)}
                      style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 4px ${timerColor}40)` }} />
                  </svg>
                  <span className="text-[14px] font-bold font-mono" style={{ color: timerColor }}>{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</span>
                </div>
              </div>
              <h2 className="text-xl font-bold leading-relaxed text-white/90">{questions[currentQ]}</h2>
            </div>

            {/* Answer */}
            {!feedback && !analyzing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={6} placeholder="Type your answer here..."
                  className="w-full px-5 py-4 rounded-2xl bg-[#12121a] border border-white/[0.06] text-white text-[14px] leading-relaxed placeholder-[#3a3a4a] focus:outline-none focus:border-[rgba(162,155,254,0.3)] resize-none transition-all" />
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={submitAnswer} disabled={!answer.trim()}
                  className="w-full py-4 rounded-xl font-bold text-[14px] text-white disabled:opacity-30" style={{ background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)' }}>
                  Submit Answer
                </motion.button>
              </motion.div>
            )}

            {/* Analyzing spinner */}
            {analyzing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 rounded-full mx-auto mb-4" style={{ border: '3px solid rgba(162,155,254,0.1)', borderTopColor: '#a29bfe' }} />
                <p className="text-[14px] text-[#8a8a9a]">AI is analyzing your answer...</p>
              </motion.div>
            )}

            {/* Feedback */}
            {feedback && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, #12121a, #0e0e16)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-4xl font-black" style={{ color: feedback.score >= 8 ? '#00b894' : feedback.score >= 6 ? '#fdcb6e' : '#ff6b6b' }}>{feedback.score}/10</div>
                    <div className="text-[11px] text-[#5a5a6a] mt-1">Overall Score</div>
                  </div>
                  <div className="p-5 rounded-2xl" style={{ background: 'rgba(0,184,148,0.04)', border: '1px solid rgba(0,184,148,0.1)' }}>
                    <div className="text-[11px] font-bold text-[#00b894] mb-3">Strengths</div>
                    {feedback.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-[12px] text-[#8a8a9a] mb-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="3" className="shrink-0 mt-0.5"><path d="M20 6L9 17L4 12"/></svg>{s}
                      </div>
                    ))}
                  </div>
                  <div className="p-5 rounded-2xl" style={{ background: 'rgba(253,203,110,0.04)', border: '1px solid rgba(253,203,110,0.1)' }}>
                    <div className="text-[11px] font-bold text-[#fdcb6e] mb-3">Improvements</div>
                    {feedback.improvements.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-[12px] text-[#8a8a9a] mb-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fdcb6e" strokeWidth="2" className="shrink-0 mt-0.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>{s}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-2xl" style={{ background: 'rgba(162,155,254,0.04)', border: '1px solid rgba(162,155,254,0.1)' }}>
                  <div className="text-[11px] font-bold text-[#a29bfe] mb-2">Better Answer Suggestion</div>
                  <p className="text-[13px] text-[#8a8a9a] leading-relaxed">{feedback.example}</p>
                </div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={nextQuestion}
                  className="w-full py-4 rounded-xl font-bold text-[14px] text-white" style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393)' }}>
                  {currentQ >= questions.length - 1 ? 'View Results' : 'Next Question'}
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}

        {mode === 'review' && (
          <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="p-8 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, rgba(162,155,254,0.08), rgba(0,184,148,0.06))', border: '1px solid rgba(162,155,254,0.15)' }}>
              <div className="text-6xl font-black mb-2" style={{ color: Number(avgScore) >= 8 ? '#00b894' : Number(avgScore) >= 6 ? '#fdcb6e' : '#ff6b6b' }}>{avgScore}</div>
              <div className="text-[14px] text-[#8a8a9a]">Average Score</div>
              <div className="flex justify-center gap-3 mt-6">
                {scores.map((s, i) => (
                  <div key={i} className="w-12 h-12 rounded-xl flex items-center justify-center text-[14px] font-bold"
                    style={{ background: s >= 8 ? 'rgba(0,184,148,0.1)' : 'rgba(253,203,110,0.1)', color: s >= 8 ? '#00b894' : '#fdcb6e' }}>{s}</div>
                ))}
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => setMode('setup')}
              className="w-full py-4 rounded-xl font-bold text-[14px] text-white" style={{ background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)' }}>
              Practice Again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
