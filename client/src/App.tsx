import { useState } from 'react'
import './App.css'

interface Offer {
  partner: string
  amount: number
  rate: number
  duration: number
  monthlyPayment: number
  totalCost: number
}

interface PartnerError {
  partner: string
  reason: string
}

interface ApiResponse {
  offers: Offer[]
  errors: PartnerError[]
}

function App() {
  const [amount, setAmount] = useState('10000')
  const [duration, setDuration] = useState('24')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [httpError, setHttpError] = useState<string | null>(null)
  const [showRaw, setShowRaw] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResponse(null)
    setHttpError(null)
    setShowRaw(false)

    try {
      const res = await fetch('/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          duration: Number(duration),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setHttpError(`${res.status} — ${JSON.stringify(data)}`)
      } else {
        setResponse(data)
      }
    } catch (err) {
      setHttpError(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

  return (
    <>
      <h1>Agrégateur d'offres</h1>
      <p className="subtitle">Testez le endpoint POST /offers</p>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="amount">Montant (€)</label>
          <input
            id="amount"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="duration">Durée (mois)</label>
          <input
            id="duration"
            type="number"
            min="1"
            step="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Chargement…' : 'Envoyer'}
        </button>
      </form>

      {httpError && (
        <div className="error-card">
          <strong>Erreur HTTP :</strong> {httpError}
        </div>
      )}

      {response && (
        <div className="results">
          {response.offers.map((offer, i) => (
            <div className="offer-card" key={i}>
              <div className="partner">{offer.partner}</div>
              <div className="offer-grid">
                <div className="stat">
                  <span className="label">Montant</span>
                  <span className="value">{fmt(offer.amount)}</span>
                </div>
                <div className="stat">
                  <span className="label">Taux annuel</span>
                  <span className="value">{offer.rate} %</span>
                </div>
                <div className="stat">
                  <span className="label">Durée</span>
                  <span className="value">{offer.duration} mois</span>
                </div>
                <div className="stat">
                  <span className="label">Mensualité</span>
                  <span className="value">{fmt(offer.monthlyPayment)}</span>
                </div>
                <div className="stat">
                  <span className="label">Coût total</span>
                  <span className="value">{fmt(offer.totalCost)}</span>
                </div>
              </div>
            </div>
          ))}

          {response.errors.map((err, i) => (
            <div className="error-card" key={i}>
              <strong>{err.partner} :</strong> {err.reason}
            </div>
          ))}

          {response.offers.length === 0 && response.errors.length === 0 && (
            <p className="status">Aucune offre retournée.</p>
          )}

          <div className="raw-toggle">
            <button onClick={() => setShowRaw(!showRaw)}>
              {showRaw ? 'Masquer' : 'Voir'} la réponse brute
            </button>
            {showRaw && (
              <pre className="raw-json">{JSON.stringify(response, null, 2)}</pre>
            )}
          </div>
        </div>
      )}

      {!response && !httpError && !loading && (
        <p className="status">
          Renseignez un montant et une durée puis cliquez sur Envoyer.
        </p>
      )}
    </>
  )
}

export default App
