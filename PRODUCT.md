# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students studying from class notes, textbook material, or other dense learning content. They open the product when they need to understand a topic and turn it into something they can study.

## Product Purpose

StudySpark helps students turn source material into a study guide, flashcards, a practice test, and a review-game foundation. Success means a student can move from unclear notes to a useful, actionable study session without manually reorganizing everything first.

## Positioning

The product's defining mechanism is clarity from chaos: it organizes dense or messy source material into a clear learning path and then gives the student multiple ways to work with that understanding.

## Operating Context

Students paste notes or source text into a web workspace, create a study kit, wait while the kit is generated, then read, recall, and test themselves. They can also browse a public library of learning resources before entering their own workspace.

## Capabilities and Constraints

- Public routes include the landing page, learning library, and library detail pages.
- Authenticated routes include the dashboard, new-material flow, and material detail/study experience.
- Auth uses password sign-in, email one-time codes, and guest access.
- Generated kits include a study guide, flashcards, and practice test; the review game surface is not yet active.
- Convex owns authentication, data access, ownership checks, material generation, flashcard status, and quiz attempts.
- Hash-based routing and relative asset paths must remain compatible with GitHub Pages deployment.
- The interface must remain responsive and keyboard accessible, with reduced-motion support.
- The existing frontend is a Vite React TypeScript app; backend and generated Convex files are outside the visual reset.

## Brand Commitments

The visible name and identity are currently inconsistent between Notefox in the UI and StudySpark AI in the document title. The user has left the final name open for this redesign. Keep the existing logo asset available and avoid inventing a final naming commitment until the identity is resolved.

## Evidence on Hand

- Existing logo asset: `src/assets/logo.svg`.
- Existing public library data and local-storage upload contract: `src/lib/library-data.ts`.
- Existing study-kit renderers and interactions: `src/components/study/`.
- No approved customer testimonials, benchmarks, or external proof should be invented during the visual reset.

## Product Principles

- Make the next useful learning action obvious.
- Turn complexity into a sequence students can trust.
- Let students practice understanding, not only reread content.
- Preserve ownership and privacy of personal study material.
- Keep expressive design subordinate to comprehension in the study workspace.
