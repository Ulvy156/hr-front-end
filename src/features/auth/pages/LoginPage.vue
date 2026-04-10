<script setup lang="ts">
import { CalendarClock, ShieldCheck, UsersRound } from 'lucide-vue-next'

import BaseCard from '@/components/ui/BaseCard.vue'

import LoginForm from '../components/LoginForm.vue'

const highlights = [
  {
    title: 'Attendance and time tracking',
    description: 'Monitor daily activity and stay current with your work schedule.',
    icon: CalendarClock,
  },
  {
    title: 'Leave and approval workflows',
    description: 'Submit requests, follow approvals, and keep managers aligned.',
    icon: ShieldCheck,
  },
  {
    title: 'Employee information in one place',
    description: 'Access profile details and HR records through a consistent workspace.',
    icon: UsersRound,
  },
] as const
</script>

<template>
  <section class="login-page">
    <BaseCard class="login-page-card">
      <div class="login-page-grid">
        <aside class="login-page-brand-panel">
          <div class="login-page-brand-copy">
            <p class="login-page-eyebrow">HR Management System</p>
            <h2 class="login-page-heading">Manage people operations with clarity.</h2>
            <p class="login-page-description">
              A focused workspace for attendance, leave, and employee records built for day-to-day HR operations.
            </p>
          </div>

          <div class="login-page-highlight-list">
            <article
              v-for="highlight in highlights"
              :key="highlight.title"
              class="login-page-highlight"
            >
              <div class="login-page-highlight-icon">
                <component :is="highlight.icon" :size="18" />
              </div>

              <div class="login-page-highlight-copy">
                <h3 class="login-page-highlight-title">{{ highlight.title }}</h3>
                <p class="login-page-highlight-text">{{ highlight.description }}</p>
              </div>
            </article>
          </div>
        </aside>

        <section class="login-page-form-panel">
          <LoginForm />
        </section>
      </div>
    </BaseCard>
  </section>
</template>

<style scoped>
.login-page {
  width: 100%;
}

.login-page-card {
  overflow: hidden;
  border-radius: calc(var(--radius) + 0.5rem);
  border-color: hsl(var(--border-gray) / 0.9);
  box-shadow: 0 28px 60px hsl(var(--foreground) / 0.08);
}

.login-page-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(22rem, 0.95fr);
  min-height: 42rem;
}

.login-page-brand-panel,
.login-page-form-panel {
  min-width: 0;
}

.login-page-brand-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2rem;
  padding: 3rem;
  background:
    linear-gradient(160deg, hsl(var(--primary) / 0.12), transparent 55%),
    linear-gradient(180deg, hsl(var(--card)), hsl(var(--secondary) / 0.55));
  border-right: 1px solid hsl(var(--border-gray));
}

.login-page-brand-copy {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 32rem;
}

.login-page-eyebrow {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 0.45rem 0.75rem;
  border-radius: 9999px;
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.login-page-heading,
.login-page-highlight-title {
  color: hsl(var(--foreground));
}

.login-page-heading {
  font-size: clamp(2rem, 3vw, 3.1rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.login-page-description,
.login-page-highlight-text {
  color: hsl(var(--muted-foreground));
}

.login-page-description {
  max-width: 30rem;
  font-size: 1rem;
  line-height: 1.7;
}

.login-page-highlight-list {
  display: grid;
  gap: 1rem;
}

.login-page-highlight {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.9rem;
  align-items: flex-start;
  padding: 1rem 1.05rem;
  border: 1px solid hsl(var(--border-gray) / 0.9);
  border-radius: calc(var(--radius) + 0.15rem);
  background: hsl(var(--card) / 0.8);
  box-shadow: 0 10px 30px hsl(var(--foreground) / 0.04);
}

.login-page-highlight-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.85rem;
  background: hsl(var(--primary) / 0.12);
  color: hsl(var(--primary));
  flex-shrink: 0;
}

.login-page-highlight-copy {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.login-page-highlight-title {
  font-size: 1rem;
  font-weight: 700;
}

.login-page-highlight-text {
  font-size: var(--text-sm);
  line-height: 1.6;
}

.login-page-form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background:
    linear-gradient(180deg, hsl(var(--card)), hsl(var(--card))),
    hsl(var(--card));
}

@media (max-width: 960px) {
  .login-page-grid {
    grid-template-columns: minmax(0, 1fr);
    min-height: auto;
  }

  .login-page-brand-panel {
    padding: 2rem;
    border-right: 0;
    border-bottom: 1px solid hsl(var(--border-gray));
  }

  .login-page-form-panel {
    padding: 1.5rem;
  }
}

@media (max-width: 640px) {
  .login-page-card {
    border-radius: calc(var(--radius) + 0.25rem);
  }

  .login-page-brand-panel,
  .login-page-form-panel {
    padding: 1.25rem;
  }

  .login-page-heading {
    font-size: 1.9rem;
  }
}
</style>
