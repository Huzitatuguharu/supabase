import { useState, useEffect } from 'react'
import { NextPage } from 'next'
import { observer } from 'mobx-react-lite'
import { isUndefined, isNil } from 'lodash'
import { PostgresTable } from '@supabase/postgres-meta'

import { tryParseJson } from 'lib/helpers'
import { useStore, withAuth } from 'hooks'
import { TableEditorLayout } from 'components/layouts'
import { EmptyState, SidePanelEditor } from 'components/interfaces/TableGridEditor'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import router from 'next/router'

const Editor: NextPage = () => {
  const { meta, ui } = useStore()
  const projectRef = ui.selectedProject?.ref
  const [sidePanelKey, setSidePanelKey] = useState<'row' | 'column' | 'table'>()
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false)
  const [selectedSchema, setSelectedSchema] = useState<string>('public')
  const [selectedTableToEdit, setSelectedTableToEdit] = useState<PostgresTable>()
  const [selectedTableToDelete, setSelectedTableToDelete] = useState<PostgresTable>()

  const onAddTable = () => {
    setSidePanelKey('table')
    setIsDuplicating(false)
    setSelectedTableToEdit(undefined)
  }

  const onEditTable = (table: PostgresTable) => {
    setSidePanelKey('table')
    setIsDuplicating(false)
    setSelectedTableToEdit(table)
  }

  const onDeleteTable = (table: PostgresTable) => {
    setIsDeleting(true)
    setSelectedTableToDelete(table)
  }

  const onDuplicateTable = (table: PostgresTable) => {
    setSidePanelKey('table')
    setIsDuplicating(true)
    setSelectedTableToEdit(table)
  }

  const onClosePanel = () => {
    setSidePanelKey(undefined)
  }

  const onConfirmDeleteTable = async () => {
    try {
      await meta.tables.del(selectedTableToDelete!.id)
      setIsDeleting(false)
      ui.setNotification({
        category: 'success',
        message: `Successfully deleted ${selectedTableToDelete!.name}`,
      })
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete ${selectedTableToDelete!.name}`,
      })
    }
  }

  return (
    <TableEditorLayout
      selectedSchema={selectedSchema}
      onSelectSchema={setSelectedSchema}
      onAddTable={onAddTable}
      onEditTable={onEditTable}
      onDeleteTable={onDeleteTable}
      onDuplicateTable={onDuplicateTable}
    >
      <EmptyState selectedSchema={selectedSchema} onAddTable={onAddTable} />
      {/* On this page it'll only handle tables */}
      <SidePanelEditor
        selectedSchema={selectedSchema}
        isDuplicating={isDuplicating}
        selectedTableToEdit={selectedTableToEdit}
        sidePanelKey={sidePanelKey}
        closePanel={onClosePanel}
        onTableCreated={(table: any) => router.push(`/project/${projectRef}/editor/${table.id}`)}
      />
      <ConfirmationModal
        danger
        visible={isDeleting && !isUndefined(selectedTableToDelete)}
        title={`Confirm deletion of table "${selectedTableToDelete?.name}"`}
        description={`Are you sure you want to delete the selected table? This action cannot be undone`}
        buttonLabel="Delete"
        buttonLoadingLabel="Deleting"
        onSelectCancel={() => setIsDeleting(false)}
        onSelectConfirm={onConfirmDeleteTable}
      />
    </TableEditorLayout>
  )
}

export default withAuth(observer(Editor))
