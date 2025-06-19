import { ApiSuccessCode } from '@/manager/client/AimsApiClient/type.ts'
import type {
  GetEmlAutoFormConfListItem,
  GetEmlAutoFormConfListParams,
  GetEmlAutoFormMessageParams,
} from '@/manager/client/aims/openAPIDefinition.schemas.ts'
import { EmailFormController } from '@/manager/controller/EmailFormController.ts'
import { autoEmailType } from '@/type/email.ts'
import { useAttachedMailStore } from '@/ui/routes/_private/email/~components/MailWrite/useAttachedMailStore.ts'
import { useMailWriteStore } from '@/ui/routes/_private/email/~components/MailWrite/useMailWriteStore.ts'
import {
  getReplySubject,
  insertOriginMessage,
} from '@/ui/routes/_private/email/~components/MailWrite/utils.ts'
import { EditorSection } from '@/ui/shared/components/NamoEditor/constants.ts'
import { insertContentAtMarker } from '@/ui/shared/components/NamoEditor/utils.ts'
import { Toast } from '@/ui/shared/components/toast'
import { useMailDetail } from '@/ui/shared/hooks/email/useMailDetail.ts'
import { EmailFormQueries } from '@/ui/shared/lib/queries/EmailFormQueries.ts'
import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

type EmailFormSelected = {
  value: string | undefined
  cd_bound: string | undefined
  cd_air_sea: string | undefined
}

export function useTest() {
  const {
    mailWriteForm: { crossEditor },
    actions: { patchMailWriteForm },
  } = useMailWriteStore()
  const {
    actions: { setAttachmentUrls },
  } = useAttachedMailStore()

  const {
    selected_email,
    cm_biz,
    cm_type_email_form,
    cd_email_new_reply,
    selected_no_eskey,
    no_order,
  } = useSearch({
    strict: false,
  })

  const [emailFormSelected, setEmailFormSelected] = useState<EmailFormSelected>(
    {
      value: undefined,
      cd_bound: undefined,
      cd_air_sea: undefined,
    },
  )

  const isShowEmailForm = useMemo(
    () => !!cm_biz && !!cm_type_email_form && !!cd_email_new_reply,
    [cm_biz, cm_type_email_form, cd_email_new_reply],
  )

  const formConfParams: GetEmlAutoFormConfListParams = useMemo(
    () => ({
      cm_biz: cm_biz ?? '',
      cm_type_email_form: cm_type_email_form ?? '',
      cd_email_new_reply: cd_email_new_reply ?? '',
    }),
    [cm_biz, cm_type_email_form, cd_email_new_reply],
  )

  const { data: emailFormConfList, isFetching: isEmailFormConfFetching } =
    useQuery({
      queryKey: EmailFormQueries.getEmlAutoFormConfList(formConfParams),
      queryFn: () => EmailFormController.getEmlAutoFormConfList(formConfParams),
      enabled: isShowEmailForm,
    })

  const emailFormOptions = useMemo(() => {
    return (emailFormConfList?.eml_form_conf_list ?? []).map(
      (item: GetEmlAutoFormConfListItem) => ({
        label: item.nm_email_form,
        value: String(item.sq_email_form_conf),
        cd_bound: item.cd_bound,
        cd_air_sea: item.cd_air_sea,
      }),
    )
  }, [emailFormConfList])

  const isAutoEmailEnabled = useMemo(
    () =>
      !!cm_biz &&
      !!cd_email_new_reply &&
      !!emailFormSelected.value &&
      !!no_order &&
      (cd_email_new_reply === autoEmailType.NewSend || !!selected_no_eskey),
    [
      cm_biz,
      cd_email_new_reply,
      emailFormSelected.value,
      no_order,
      selected_no_eskey,
    ],
  )

  const formMessageParams: GetEmlAutoFormMessageParams = useMemo(
    () => ({
      cm_biz: cm_biz ?? '',
      cd_email_new_reply: cd_email_new_reply ?? '',
      sq_email_form_conf: Number(emailFormSelected.value),
      ...(cd_email_new_reply === autoEmailType.Reply && {
        no_eskey: selected_no_eskey ?? '',
      }),
      no_order: no_order ?? '',
      cd_bound: emailFormSelected.cd_bound ?? '',
      cd_air_sea: emailFormSelected.cd_air_sea ?? '',
    }),
    [
      cm_biz,
      cd_email_new_reply,
      emailFormSelected.value,
      no_order,
      selected_no_eskey,
    ],
  )

  const { data: autoEmailMessage, isFetching: isAutoEmailFetching } = useQuery({
    queryKey: EmailFormQueries.getEmlAutoFormMessage(formMessageParams),
    queryFn: () => EmailFormController.getEmlAutoFormMessage(formMessageParams),
    enabled: isAutoEmailEnabled,
  })

  const { data: mailDetail } = useMailDetail({
    params: { no_eskey: selected_no_eskey, cm_user_email: selected_email },
    options: { enabled: !!selected_email && !!selected_no_eskey },
  })

  useEffect(() => {
    if (!emailFormOptions.length) return

    const { cd_bound, cd_air_sea, value } = emailFormOptions[0]
    setEmailFormSelected({
      cd_bound,
      cd_air_sea,
      value,
    })
  }, [emailFormOptions])

  useEffect(() => {
    if (!autoEmailMessage || !crossEditor) return

    const {
      result,
      dc_from,
      dc_to,
      dc_cc,
      dc_subject,
      attachment_list,
      dc_body,
    } = autoEmailMessage

    if (result?.code !== ApiSuccessCode) {
      Toast.negative(result?.message)
      console.error(result?.message)
      return
    }

    const mailSubject = dc_subject?.trim()
      ? dc_subject
      : mailDetail?.dc_subject?.trim() || ''

    patchMailWriteForm({
      ...(dc_from ? { senderEmail: dc_from } : {}),
      ...(cd_email_new_reply === autoEmailType.Reply
        ? {
          recipientData: {
            toList: dc_to,
            ccList: dc_cc || [],
            bccList: [],
          },
        }
        : {}),
      mailSubject: getReplySubject(mailSubject),
    })

    setAttachmentUrls(attachment_list)
    insertContentAtMarker({
      iframeEditor: crossEditor.ceIfrEditor,
      markerName: EditorSection.AutoEmail,
      html: dc_body ?? '',
    })
    insertOriginMessage(mailDetail, crossEditor)
  }, [autoEmailMessage, mailDetail, crossEditor])

  return {
    isShowEmailForm,
    isFetching: isEmailFormConfFetching || isAutoEmailFetching,
    emailFormOptions,
    emailFormSelected,
    setEmailFormSelected,
  }
}
