import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout, RequireUser } from './components/ui.jsx'
import Landing from './pages/Landing.jsx'
import Auth from './pages/Auth.jsx'
import Questionnaire from './pages/Questionnaire.jsx'
import Home from './pages/Home.jsx'
import Clients from './pages/Clients.jsx'
import Prestations from './pages/Prestations.jsx'
import DevisList from './pages/DevisList.jsx'
import NouveauDevis from './pages/NouveauDevis.jsx'
import Factures from './pages/Factures.jsx'
import NouvelleFacture from './pages/NouvelleFacture.jsx'
import Entreprise from './pages/Entreprise.jsx'
import DocView from './pages/DocView.jsx'
import Demo from './pages/Demo.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/connexion" element={<Auth mode="login" />} />
      <Route path="/inscription" element={<Auth mode="register" />} />
      <Route path="/questionnaire" element={<RequireUser><Questionnaire /></RequireUser>} />
      <Route path="/app/devis/nouveau" element={<RequireUser><NouveauDevis /></RequireUser>} />
      <Route path="/app/factures/nouvelle" element={<RequireUser><NouvelleFacture /></RequireUser>} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="clients" element={<Clients />} />
        <Route path="prestations" element={<Prestations />} />
        <Route path="devis" element={<DevisList />} />
        <Route path="devis/:id" element={<DocView kind="devis" />} />
        <Route path="factures" element={<Factures />} />
        <Route path="factures/:id" element={<DocView kind="facture" />} />
        <Route path="entreprise" element={<Entreprise />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
