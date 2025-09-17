import SmartAgriTechComponent from "@/components/smart-agri-tech"
import { TubelightNavBarDemo } from "@/components/ui/tubelight-navbar-demo"
import { SmartAgriTechNavbar } from "@/components/ui/smart-agritech-navbar"
import { SimpleTestNavbar } from "@/components/ui/simple-test-navbar"

export default function Home() {
  return (
    <>
      <SimpleTestNavbar />
      <SmartAgriTechNavbar />
      <TubelightNavBarDemo />
      <SmartAgriTechComponent />
    </>
  )
}
