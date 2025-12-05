/**
 * Atomic Components Examples
 * 
 * This file demonstrates the usage of all atomic components.
 * Use this as a reference for implementing these components in your features.
 */

import {
  Button,
  Input,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Spinner,
  Icon,
} from "./index";
import { Home, User, Settings, Mail, Bell } from "lucide-react";

export function AtomicComponentsShowcase() {
  return (
    <div className="space-y-8 p-8">
      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="farmer">Farmer</Button>
          <Button variant="harvest">Harvest</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <Home />
          </Button>
        </div>
      </section>

      {/* Inputs */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Inputs</h2>
        <div className="space-y-2 max-w-md">
          <Input type="text" placeholder="Text input" />
          <Input type="email" placeholder="Email input" />
          <Input type="password" placeholder="Password input" />
          <Input type="number" placeholder="Number input" />
          <Input disabled placeholder="Disabled input" />
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      {/* Avatars */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Avatars</h2>
        <div className="flex flex-wrap gap-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar className="h-16 w-16">
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
        </div>
      </section>

      {/* Spinners */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Spinners</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Spinner size="sm" variant="default" />
          <Spinner size="md" variant="default" />
          <Spinner size="lg" variant="default" />
          <Spinner size="xl" variant="default" />
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <Spinner size="md" variant="default" />
          <Spinner size="md" variant="secondary" />
          <Spinner size="md" variant="muted" />
          <div className="bg-primary p-4 rounded">
            <Spinner size="md" variant="white" />
          </div>
        </div>
      </section>

      {/* Icons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Icons</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Icon icon={Home} size="xs" variant="default" label="Home" />
          <Icon icon={User} size="sm" variant="primary" label="User" />
          <Icon icon={Settings} size="md" variant="secondary" label="Settings" />
          <Icon icon={Mail} size="lg" variant="success" label="Mail" />
          <Icon icon={Bell} size="xl" variant="warning" label="Notifications" />
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <Icon icon={Home} size="md" variant="default" label="Default" />
          <Icon icon={Home} size="md" variant="primary" label="Primary" />
          <Icon icon={Home} size="md" variant="secondary" label="Secondary" />
          <Icon icon={Home} size="md" variant="muted" label="Muted" />
          <Icon icon={Home} size="md" variant="destructive" label="Destructive" />
          <Icon icon={Home} size="md" variant="success" label="Success" />
          <Icon icon={Home} size="md" variant="warning" label="Warning" />
          <Icon icon={Home} size="md" variant="info" label="Info" />
        </div>
      </section>

      {/* Combined Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Combined Examples</h2>
        <div className="space-y-2">
          <Button>
            <Icon icon={Home} size="sm" variant="default" label="" />
            Home
          </Button>
          <Button variant="outline">
            <Icon icon={User} size="sm" variant="default" label="" />
            Profile
          </Button>
          <Button variant="secondary" disabled>
            <Spinner size="sm" variant="muted" />
            Loading...
          </Button>
        </div>
      </section>
    </div>
  );
}

export default AtomicComponentsShowcase;
