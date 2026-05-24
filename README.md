# SpaceX Launch Platform

A cinematic, interactive, SpaceX-inspired launch intelligence platform built with modern web technologies.

The project combines:
- real-time mission presentation,
- interactive launch timelines,
- livestream integration,
- mission-control-inspired UI/UX,
- multilingual architecture,
- AI-assisted editorial workflows,
- and a scalable admin CMS.

---

# Vision

This platform is designed to become a high-quality SpaceX-focused ecosystem for:

- upcoming launches,
- past missions,
- livestream tracking,
- launch timelines,
- mission analytics,
- educational aerospace content,
- and AI-assisted launch/news management.

The project is inspired by the visual atmosphere and engineering precision of SpaceX, while maintaining its own original design system and architecture.

---

# Current MVP Status

## Public Platform
Implemented:
- Home page
- Upcoming launches
- Past launches
- Launch detail pages
- Launch calendar
- Articles
- News
- FAQ
- RU/EN multilingual structure
- Countdown system
- Mission timeline UI
- Cinematic 2.5D launch animation
- YouTube livestream/replay embedding
- Source confidence badges
- SpaceX-inspired dark UI/UX

## Admin Platform
Implemented:
- `/admin` dashboard
- Launch management
- Timeline builder
- Articles CMS
- News CMS
- Source management
- AI Draft Center
- Live Control placeholder
- Settings page
- Role-based architecture
- Approval workflow architecture
- Source verification model
- AI moderation boundaries

---

# Technology Stack

## Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## Architecture
- App Router
- Modular component system
- Repository pattern
- AI service boundary
- Approval workflow system
- Multilingual structure

## Planned Backend Stack
- PostgreSQL
- Prisma ORM
- Supabase/Auth.js
- OpenAI API
- Launch Library 2 API
- YouTube Data API

---

# Features

## Interactive Launch Experience
- Live countdowns
- Mission timelines
- Launch event tracking
- Liftoff → MECO → Stage Separation → Landing visualization
- Cinematic 2.5D rocket animation
- Falcon 9 / Starship inspired visuals

## Mission Timeline
Supports:
- Countdown
- Liftoff
- Max Q
- MECO
- Stage Separation
- SES
- SECO
- Entry Burn
- Landing Burn
- Booster Landing
- Payload Deployment

## Multilingual
Current:
- English
- Russian

Planned:
- Spanish
- Italian
- French

## AI Workflow
AI can:
- generate launch summaries
- prepare draft articles
- summarize news
- compare sources
- generate SEO metadata
- suggest timeline events

AI cannot:
- publish directly
- overwrite official data
- silently resolve source conflicts
- modify approved records without review

---

# Data Accuracy Philosophy

This platform prioritizes source transparency and verification.

## Source Hierarchy

### Primary Sources
- Official SpaceX
- Official SpaceX YouTube
- NASA
- FAA

### API Sources
- Launch Library 2
- YouTube APIs

### Secondary Sources
- NASASpaceflight
- Spaceflight Now
- Next Spaceflight

Secondary sources never override official confirmed data.

---

# Source Confidence System

Launches and news support:
- Official Confirmed
- Admin Verified
- Multi-source Confirmed
- Estimated
- Unverified
- Conflicting Data

---

# Project Structure

```text
apps/web/
├── app/
├── components/
├── data/
├── lib/
├── messages/
├── types/

docs/
├── ARCHITECTURE.md
├── DESIGN_SYSTEM.md
├── MVP_ROADMAP.md