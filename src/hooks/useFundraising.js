/**
 * useFundraising Hook
 *
 * Manages all state and behavior for the Fundraising module.
 * Coordinates between the domain (stats, calculations) and service (DB calls).
 */

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import {
  getFundraisingData,
  createCampaign, updateCampaign, deleteCampaign,
  searchDonors as searchDonorsService,
  createDonation, toggleReceipt as toggleReceiptService,
  createEvent,
} from '../services/fundraising'
import {
  BLANK_CAMPAIGN, BLANK_DONATION, BLANK_EVENT,
  buildDonorMap, calcLybunt, calcFundraisingStats,
  filterDonations, getAlumnusTotal,
} from '../domain/fundraising'

export function useFundraising(userId) {
  const [activeTab, setActiveTab] = useState('campaigns')

  const [campaigns,       setCampaigns]       = useState([])
  const [donations,       setDonations]       = useState([])
  const [events,          setEvents]          = useState([])
  const [alumniProspects, setAlumniProspects] = useState([])
  const [loading,         setLoading]         = useState(true)

  // Campaign form
  const [showCampaignForm, setShowCampaignForm] = useState(false)
  const [campaignForm,     setCampaignForm]     = useState({ ...BLANK_CAMPAIGN })
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [savingCampaign,   setSavingCampaign]   = useState(false)
  const [editingCampaign,  setEditingCampaign]  = useState(false)

  // Donation form
  const [showDonationForm, setShowDonationForm] = useState(false)
  const [donationForm,     setDonationForm]     = useState({ ...BLANK_DONATION })
  const [donorSearch,      setDonorSearch]      = useState('')
  const [donorResults,     setDonorResults]     = useState([])
  const [savingDonation,   setSavingDonation]   = useState(false)
  const [donationError,    setDonationError]    = useState('')
  const [donationFilter,   setDonationFilter]   = useState('all')

  // Event form
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventForm,     setEventForm]     = useState({ ...BLANK_EVENT })
  const [savingEvent,   setSavingEvent]   = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const { campaigns: c, donations: d, events: e, alumniProspects: a } = await getFundraisingData(supabase, userId)
    setCampaigns(c)
    setDonations(d)
    setEvents(e)
    setAlumniProspects(a)
    setLoading(false)
  }

  // ─── Campaign ──────────────────────────────────────────────────────────────

  const openNewCampaign = () => {
    setCampaignForm({ ...BLANK_CAMPAIGN })
    setEditingCampaign(false)
    setShowCampaignForm(f => !f)
  }

  const openEditCampaign = (campaign) => {
    setCampaignForm({ ...campaign, goal: campaign.goal || '' })
    setEditingCampaign(true)
    setShowCampaignForm(true)
    setSelectedCampaign(null)
  }

  const saveCampaign = async () => {
    if (!campaignForm.name) return
    setSavingCampaign(true)
    try {
      if (editingCampaign) {
        const updated = await updateCampaign(supabase, selectedCampaign?.id || campaignForm.id, campaignForm)
        setSelectedCampaign(updated)
      } else {
        await createCampaign(supabase, userId, campaignForm)
      }
      setShowCampaignForm(false)
      setEditingCampaign(false)
      setCampaignForm({ ...BLANK_CAMPAIGN })
      load()
    } finally {
      setSavingCampaign(false)
    }
  }

  const removeCampaign = async (id) => {
    await deleteCampaign(supabase, id)
    setSelectedCampaign(null)
    load()
  }

  // ─── Donation ──────────────────────────────────────────────────────────────

  const openDonationForm = () => {
    setShowDonationForm(f => !f)
    setDonationError('')
    setDonationForm({ ...BLANK_DONATION })
    setDonorSearch('')
    setDonorResults([])
  }

  const handleDonorTypeChange = (type) => {
    setDonationForm(prev => ({ ...prev, donor_type: type, donor_id: '', donor_name: '', donor_email: '' }))
    setDonorSearch('')
    setDonorResults([])
    setDonationError('')
  }

  const handleDonorSearch = async (query, type) => {
    setDonorSearch(query)
    const results = await searchDonorsService(supabase, userId, query, type)
    setDonorResults(results)
  }

  const selectDonor = (result) => {
    setDonationForm(prev => ({ ...prev, donor_id: result.id, donor_name: result.name, donor_email: result.email }))
    setDonorSearch(result.name)
    setDonorResults([])
  }

  const saveDonation = async () => {
    setDonationError('')
    const resolvedName = donationForm.donor_type !== 'External' && !donationForm.donor_id
      ? donorSearch.trim()
      : donationForm.donor_name
    if (!resolvedName) {
      setDonationError('Please search and select a donor, or switch to External to enter a name manually.')
      return
    }
    if (!donationForm.amount) {
      setDonationError('Please enter a donation amount.')
      return
    }
    setSavingDonation(true)
    try {
      await createDonation(supabase, userId, { ...donationForm, donor_name: resolvedName })
      setShowDonationForm(false)
      setDonationForm({ ...BLANK_DONATION })
      setDonorSearch('')
      setDonorResults([])
      setDonationError('')
      load()
    } catch (err) {
      setDonationError(err.message)
    } finally {
      setSavingDonation(false)
    }
  }

  const handleToggleReceipt = async (id, current) => {
    await toggleReceiptService(supabase, id, current)
    load()
  }

  // ─── Event ─────────────────────────────────────────────────────────────────

  const saveEvent = async () => {
    if (!eventForm.name) return
    setSavingEvent(true)
    try {
      await createEvent(supabase, userId, eventForm)
      setShowEventForm(false)
      setEventForm({ ...BLANK_EVENT })
      load()
    } finally {
      setSavingEvent(false)
    }
  }

  // ─── Derived ───────────────────────────────────────────────────────────────

  const donorList        = buildDonorMap(donations)
  const lybunt           = calcLybunt(donorList, donations)
  const stats            = calcFundraisingStats(campaigns, donations, events)
  const filteredDonations = filterDonations(donations, donationFilter)
  const currentYear      = new Date().getFullYear()
  const lastYear         = currentYear - 1

  const getAlumnusGiven = (alumnusId) => getAlumnusTotal(donations, alumnusId)

  return {
    // data
    campaigns, donations, events, alumniProspects, loading,
    stats, donorList, lybunt, filteredDonations,
    currentYear, lastYear,
    // tabs
    activeTab, setActiveTab,
    // campaign
    showCampaignForm, campaignForm, setCampaignForm,
    selectedCampaign, setSelectedCampaign,
    savingCampaign, editingCampaign,
    openNewCampaign, openEditCampaign, saveCampaign, removeCampaign,
    // donation
    showDonationForm, donationForm, setDonationForm,
    donorSearch, donorResults,
    savingDonation, donationError,
    donationFilter, setDonationFilter,
    openDonationForm, handleDonorTypeChange, handleDonorSearch, selectDonor,
    saveDonation, handleToggleReceipt,
    // event
    showEventForm, setShowEventForm, eventForm, setEventForm,
    savingEvent, saveEvent,
    // helpers
    getAlumnusGiven,
  }
}
