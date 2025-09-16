import { 
  Home, 
  CloudRain, 
  Bug, 
  Leaf, 
  DollarSign, 
  Users, 
  Wrench, 
  MessageCircle,
  BarChart3,
  Camera,
  Thermometer,
  Shield
} from "lucide-react";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";

export function AgriExpandableTabsDemo() {
  const defaultTabs = [
    { title: "Dashboard", icon: Home },
    { title: "Weather", icon: CloudRain },
    { title: "Pest Detection", icon: Bug },
    { type: "separator" },
    { title: "Soil Analysis", icon: Leaf },
    { title: "Market Prices", icon: DollarSign },
    { title: "Dealers", icon: Users },
  ];

  const customColorTabs = [
    { title: "Tools", icon: Wrench },
    { title: "Chat", icon: MessageCircle },
    { type: "separator" },
    { title: "Analytics", icon: BarChart3 },
    { title: "Camera", icon: Camera },
    { title: "Monitoring", icon: Thermometer },
    { title: "Security", icon: Shield },
  ];

  const handleTabChange = (index: number | null) => {
    if (index !== null) {
      console.log(`Selected tab at index: ${index}`);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Smart AgriTech Navigation</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Interactive expandable tabs for seamless navigation through agricultural features
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Default Style</h3>
          <div className="flex justify-center">
            <ExpandableTabs 
              tabs={defaultTabs} 
              onChange={handleTabChange}
            />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Custom Green Theme</h3>
          <div className="flex justify-center">
            <ExpandableTabs 
              tabs={customColorTabs} 
              activeColor="text-green-600"
              className="border-green-200 dark:border-green-800"
              onChange={handleTabChange}
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Features:</h3>
        <ul className="space-y-2 text-gray-600">
          <li>• <strong>Click to expand:</strong> Tabs show icons initially, expand to show text when selected</li>
          <li>• <strong>Click outside to collapse:</strong> Click anywhere outside to collapse the expanded tab</li>
          <li>• <strong>Smooth animations:</strong> Framer Motion powered transitions</li>
          <li>• <strong>Separators:</strong> Visual dividers between tab groups</li>
          <li>• <strong>Customizable colors:</strong> Support for custom active colors and styling</li>
          <li>• <strong>Responsive design:</strong> Adapts to different screen sizes</li>
        </ul>
      </div>
    </div>
  );
}

export function DefaultDemo() {
  const tabs = [
    { title: "Dashboard", icon: Home },
    { title: "Notifications", icon: CloudRain },
    { type: "separator" },
    { title: "Settings", icon: Wrench },
    { title: "Support", icon: MessageCircle },
    { title: "Security", icon: Shield },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ExpandableTabs tabs={tabs} />
    </div>
  );
}

export function CustomColorDemo() {
  const tabs = [
    { title: "Profile", icon: Users },
    { title: "Messages", icon: MessageCircle },
    { type: "separator" },
    { title: "Documents", icon: Leaf },
    { title: "Privacy", icon: Shield },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ExpandableTabs 
        tabs={tabs} 
        activeColor="text-blue-500"
        className="border-blue-200 dark:border-blue-800" 
      />
    </div>
  );
}
