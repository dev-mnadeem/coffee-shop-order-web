import { useCallback, useState } from 'react';
import { Button, Container, Table } from 'react-bootstrap';
import PageHeader from '../components/PageHeader';
import StateView from '../components/StateView';
import { listCustomers } from '../api/customers';
import useAsync from '../hooks/useAsync';

const PER_PAGE = 25;

/**
 * Everyone who has ever ordered.
 *
 * Unlike the menu this list grows without bound, so it is the one screen that
 * pages: the API has always returned `meta.total_pages` and the first version
 * of this client ignored it, quietly showing only the newest 25 customers
 * with no hint there were more.
 */
export default function Customers() {
  const [page, setPage] = useState(1);
  const load = useCallback(
    ({ signal }) => listCustomers({ page, perPage: PER_PAGE, signal }),
    [page]
  );
  const { status, data, error, reload } = useAsync(load);

  const customers = (data && data.records) || [];
  const meta = (data && data.meta) || {};
  const totalPages = Number(meta.total_pages) || 1;
  const totalCount = Number(meta.total_count) || 0;

  return (
    <>
      <PageHeader
        title="Customers"
        description={
          totalCount > 0
            ? `${totalCount} customer${totalCount === 1 ? '' : 's'} have ordered here.`
            : 'Everyone who has ordered here.'
        }
      />
      <Container>
        <StateView
          status={status}
          error={error}
          isEmpty={customers.length === 0}
          emptyTitle="No customers yet"
          emptyBody="The first order will create one."
          onRetry={reload}
        >
          <div className="surface p-2">
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col" className="text-secondary fw-normal">
                    #
                  </th>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <tr key={customer.id}>
                    <td className="text-secondary">{(page - 1) * PER_PAGE + index + 1}</td>
                    <td>{customer.name}</td>
                    <td>
                      <a href={`mailto:${customer.email}`}>{customer.email}</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {totalPages > 1 ? (
            <nav
              className="d-flex justify-content-between align-items-center mt-3"
              aria-label="Customer pages"
            >
              <Button
                variant="outline-secondary"
                className="btn-outline-coffee"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                ← Newer
              </Button>
              <span className="text-secondary">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline-secondary"
                className="btn-outline-coffee"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Older →
              </Button>
            </nav>
          ) : null}
        </StateView>
      </Container>
    </>
  );
}
