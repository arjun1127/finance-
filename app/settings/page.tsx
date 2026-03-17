"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Section } from "@/components/finance-ui/section"
import { FormRow } from "@/components/finance-ui/form-row"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/finance-ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useFinanceProfile } from "@/hooks/useFinanceProfile"
import { JapanEstimatorCard } from "@/app/settings/components/japan-estimator-card"

export default function SettingsPage() {
  const { profile, dispatch } = useFinanceProfile()

  return (
    <AppShell
      title="Settings"
      subtitle="Preferences, safety defaults, and Japan scenario controls."
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Section
          title="Planner preferences"
          description="These settings directly influence simulation behavior."
          tone="dark"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <FormRow label="Current savings">
              <Input
                type="number"
                min={0}
                value={profile.currentSavings.toString()}
                onChange={(event) => {
                  const val = event.target.value
                  dispatch({
                    type: "set_savings",
                    payload: val === "" ? 0 : Number(val),
                  })
                }}
              />
            </FormRow>

            <FormRow label="Home currency">
              <select
                className="finance-input"
                value={profile.settings.homeCurrency}
                onChange={(event) =>
                  dispatch({
                    type: "set_settings",
                    payload: { homeCurrency: event.target.value as "INR" | "JPY" },
                  })
                }
              >
                <option value="INR">INR</option>
                <option value="JPY">JPY</option>
              </select>
            </FormRow>

            <FormRow label="Country mode">
              <select
                className="finance-input"
                value={profile.settings.countryMode}
                onChange={(event) =>
                  dispatch({
                    type: "set_settings",
                    payload: { countryMode: event.target.value as "india" | "japan" },
                  })
                }
              >
                <option value="india">India</option>
                <option value="japan">Japan</option>
              </select>
            </FormRow>

            <FormRow label="Japan city">
              <select
                className="finance-input"
                value={profile.settings.city}
                onChange={(event) =>
                  dispatch({
                    type: "set_settings",
                    payload: {
                      city: event.target.value as "tokyo" | "osaka" | "kyoto" | "fukuoka",
                    },
                  })
                }
              >
                <option value="tokyo">Tokyo</option>
                <option value="osaka">Osaka</option>
                <option value="kyoto">Kyoto</option>
                <option value="fukuoka">Fukuoka</option>
              </select>
            </FormRow>

            <FormRow label="Safety buffer months">
              <Input
                type="number"
                min={1}
                max={24}
                value={profile.settings.safetyBufferMonths.toString()}
                onChange={(event) => {
                  const val = event.target.value
                  dispatch({
                    type: "set_settings",
                    payload: { safetyBufferMonths: val === "" ? 6 : Number(val) },
                  })
                }}
              />
            </FormRow>
          </div>
        </Section>

        <JapanEstimatorCard profile={profile} dispatch={dispatch} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile controls</CardTitle>
          <CardDescription>Reset everything to an empty profile when you want a fresh start.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => dispatch({ type: "reset_profile" })}>
            Reset profile
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  )
}
