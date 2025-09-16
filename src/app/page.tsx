import SmartAgriTechComponent from "@/components/smart-agri-tech"
import { ObviousNavbar } from "@/components/ui/obvious-navbar"
import { AgriExpandableTabsDemo } from "@/components/ui/agri-expandable-tabs-demo"
import { VoiceDebug } from "@/components/ui/voice-debug"

export default function Home() {
  return (
    <>
      <ObviousNavbar />
      <div style={{ paddingTop: '120px' }}>
        <div className="mb-8">
          <AgriExpandableTabsDemo />
        </div>
        <div className="mb-8">
          <VoiceDebug />
        </div>
        <SmartAgriTechComponent />
      </div>
    </>
  )
}
