import { GROUP_CODE } from '@/type/code'
import { autoEmailType } from '@/type/email.ts'
import { Button } from '@/ui/shared/components/Button'
import { IconButton } from '@/ui/shared/components/Button/IconButton'
import { Menu } from '@/ui/shared/components/Menu'
import { popupConfig } from '@/ui/shared/constants/popupConfig'
import { useDetailPageInfo } from '@/ui/shared/hooks/email/useDetailPageInfo.ts'
import { useMailWriteOpen } from '@/ui/shared/hooks/email/useMailWriteOpen.tsx'
import { useCodeDetail } from '@/ui/shared/hooks/useCodeDetail'
import { usePopup } from '@/ui/shared/hooks/usePopup'
import {
  IconCaretLeftFilled,
  IconClipboardOff,
  IconCornerUpLeft,
  IconDotsVertical,
  IconExternalLink,
} from '@tabler/icons-react'
import { useSearch } from '@tanstack/react-router'
import { useState } from 'react'

interface OrderBlockListProps {
  orders: string[]
  onRemove: (orderNo: string) => void
}

const MAX_VISIBLE = 2

export const OrderBlockList = ({ orders, onRemove }: OrderBlockListProps) => {
  const [expanded, setExpanded] = useState(false)

  const visibleOrders = expanded ? orders : orders.slice(0, MAX_VISIBLE)
  const hiddenCount = orders.length - MAX_VISIBLE

  return (
    <div className="flex gap-1 items-center">
      {visibleOrders.map((order) => (
        <OrderBlock key={order} orderNo={order} onRemove={onRemove} />
      ))}

      {!expanded && hiddenCount > 0 && (
        <Button type="ghost" size="xs" onClick={() => setExpanded(true)}>
          +{hiddenCount}
        </Button>
      )}

      {expanded && orders.length > MAX_VISIBLE && (
        <IconButton
          Icon={IconCaretLeftFilled}
          type="ghost"
          size="xs"
          onClick={() => setExpanded(false)}
        />
      )}
    </div>
  )
}

interface OrderBlockProps {
  orderNo: string
  onRemove: (orderNo: string) => void
}

const OrderBlock = ({ orderNo, onRemove }: OrderBlockProps) => {
  const { open: openOrderPanel } = usePopup(popupConfig.orderPanel(orderNo))

  return (
    <div className="flex items-center gap-[2px] px-1 text-b3xs text-gray-700 border border-gray-200 bg-gray-50 rounded-md">
      <span className="pl-1">{orderNo}</span>
      <Menu>
        <Menu.Trigger>
          <IconButton
            Icon={IconDotsVertical}
            type="ghost"
            size="xs"
            className="text-gray-400"
          />
        </Menu.Trigger>
        <Menu.Dropdown>
          <Menu.Item FrontIcon={IconExternalLink} onClick={openOrderPanel}>
            Order Panel
          </Menu.Item>
          <Menu.SubMenuItem
            label="E-mail form reply"
            FrontIcon={IconCornerUpLeft}
          >
          </Menu.SubMenuItem>
          <Menu.Item
            FrontIcon={IconClipboardOff}
            onClick={() => onRemove(orderNo)}
          >
            Cancel Mapping
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  )
}