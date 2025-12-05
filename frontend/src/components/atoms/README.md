# Atomic Components (Atoms)

This directory contains the basic building blocks of the AgroBridge UI. These are the smallest, most fundamental components that cannot be broken down further.

## Components

### Button
A versatile button component with multiple variants and sizes.

**Location:** `../ui/button.tsx` (shadcn/ui)

**Usage:**
```tsx
import { Button } from "@/components/atoms";

<Button variant="primary" size="md">Click me</Button>
<Button variant="outline" size="sm">Small Button</Button>
<Button variant="destructive" size="lg">Delete</Button>
```

**Variants:** `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `harvest`, `farmer`, `earth`, `sky`

**Sizes:** `default`, `sm`, `lg`, `icon`

---

### Input
A styled input field component with validation states.

**Location:** `../ui/input.tsx` (shadcn/ui)

**Usage:**
```tsx
import { Input } from "@/components/atoms";

<Input type="text" placeholder="Enter your name" />
<Input type="email" placeholder="Email address" />
<Input type="password" placeholder="Password" />
```

---

### Badge
A badge component for displaying status indicators and labels.

**Location:** `../ui/badge.tsx` (shadcn/ui)

**Usage:**
```tsx
import { Badge } from "@/components/atoms";

<Badge variant="default">Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Draft</Badge>
```

**Variants:** `default`, `secondary`, `destructive`, `outline`

---

### Avatar
An avatar component with image and fallback support.

**Location:** `../ui/avatar.tsx` (shadcn/ui)

**Usage:**
```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/atoms";

<Avatar>
  <AvatarImage src="/path/to/image.jpg" alt="User name" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

---

### Spinner
A loading spinner component with multiple sizes and variants.

**Location:** `./Spinner.tsx`

**Usage:**
```tsx
import { Spinner } from "@/components/atoms";

<Spinner size="md" variant="default" />
<Spinner size="sm" variant="secondary" label="Loading data..." />
<Spinner size="lg" variant="white" />
```

**Sizes:** `sm`, `md`, `lg`, `xl`

**Variants:** `default`, `secondary`, `muted`, `white`

**Props:**
- `size`: Size of the spinner
- `variant`: Color variant
- `label`: Accessible label for screen readers (default: "Loading")

---

### Icon
A wrapper component for Lucide icons with consistent sizing and styling.

**Location:** `./Icon.tsx`

**Usage:**
```tsx
import { Icon } from "@/components/atoms";
import { Home, User, Settings } from "lucide-react";

<Icon icon={Home} size="md" variant="default" label="Home" />
<Icon icon={User} size="sm" variant="primary" />
<Icon icon={Settings} size="lg" variant="muted" />
```

**Sizes:** `xs`, `sm`, `md`, `lg`, `xl`

**Variants:** `default`, `primary`, `secondary`, `muted`, `destructive`, `success`, `warning`, `info`

**Props:**
- `icon`: Lucide icon component (required)
- `size`: Size of the icon
- `variant`: Color variant
- `label`: Accessible label for screen readers

---

## Design Principles

1. **Single Responsibility**: Each atom serves one specific purpose
2. **Composability**: Atoms can be combined to create more complex components
3. **Consistency**: All atoms follow the same design token system
4. **Accessibility**: All atoms include proper ARIA labels and semantic HTML
5. **Type Safety**: Full TypeScript support with proper prop types

## Usage Guidelines

- Import atoms from the index file: `import { Button, Input } from "@/components/atoms"`
- Always provide accessible labels for icons and spinners
- Use the appropriate variant and size for your use case
- Refer to the design token system in `src/styles/tokens.css` for custom styling

## Related Documentation

- [Design Tokens](../../styles/tokens.css)
- [Molecular Components](../molecules/README.md)
- [Organism Components](../organisms/README.md)
