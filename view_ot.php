<?php
$qry = $conn->query("SELECT * FROM overtime_requests where id = '{$_GET['id']}'");
if ($qry->num_rows > 0) {
    foreach ($qry->fetch_array() as $k => $v) {
        if ($k === 'date_created') {
            $date_created_ot_request = $v;
        } else {
            $$k = $v;
        }
    }
}

$qry1 = $conn->query("SELECT * FROM employee_masterlist where EMPLOYID = '{$requestor_id}'");
if ($qry1->num_rows > 0) {
    foreach ($qry1->fetch_array() as $k1 => $v1) {
        $$k1 = $v1;
    }
}

$lblManager = "APPROVER";
$lblDirector = "APPROVER";

if ($dh_status == 1) {
    $lblManager = "APPROVED BY";
}
if ($od_status == 1) {
    $lblDirector = "APPROVED BY";
}

if ($dh_status == 2) {
    $lblManager = "DISAPPROVED BY";
}
if ($od_status == 2) {
    $lblDirector = "DISAPPROVED BY";
}

?>
<div class="card card-outline card-primary">
    <div class="card-header">
        <h4 class="card-title">Overtime Request Details : <?php echo $ot_form_no ?>&nbsp;</h4>
        <div class="card-tools">
            <?php if ($ot_status == 0) : ?>
                <span class="badge badge-primary rounded-pill"> Pending</span>
            <?php elseif ($ot_status == 1) : ?>
                <span class="badge badge-warning rounded-pill">Partially Approved</span>
            <?php elseif ($ot_status == 2) : ?>
                <span class="badge badge-success rounded-pill"> Approved</span>
            <?php elseif ($ot_status == 3) :
            ?>
                <span class="badge badge-danger rounded-pill"> Disapproved</span>
            <?php else : ?>
                <span class="badge badge-secondary rounded-pill"> Cancelled</span>
            <?php endif; ?>
        </div>
    </div>
    <div class="card-body" id="print_out">
        <div class="container-fluid">
            <div class="row">
                <div class="col-md-12">
                    <?php
                    // if ($pa_status != 5) {
                    //     $lblHeader = "Discussed and Assessed ";
                    // }
                    // if ($pa_status == 5) {
                    //     $lblHeader = "Cancelled ";
                    // }
                    $lblHeader = "PREPARED";
                    ?>
                    <label class="control-label text-info"><?php echo $lblHeader ?> by <i>Immediate Supervisor</i></label>
                    <?php
                    $qry = $conn->query("SELECT * FROM employee_masterlist WHERE EMPLOYID = '{$requestor_id}'");
                    while ($row = $qry->fetch_assoc()) :
                        $reqName = $row['EMPNAME'];
                        $reqPosition = $row['JOB_TITLE'];
                        $reqDepartment = $row['DEPARTMENT'];
                        $reqGender = $row['EMPSEX'];
                    endwhile;
                    // $newDateformat = date("l, F j, Y H:m:s A", strtotime($od_sign_date));
                    $dateCreated = new DateTime($date_created_ot_request);
                    $newDateformat = $dateCreated->format('m-d-Y h:i:s a');
                    ?>
                    <div class="mt-1">
                        <div class="user-block">
                            <?php
                            switch ($reqGender) {
                                case 1:
                            ?>
                                    <img class="img-circle img-bordered-sm" src="<?php echo validate_image('admin/overtimeForm/profile.png') ?>">
                                    <?php
                                    break;
                                    ?>
                                <?php
                                case 2:
                                ?>
                                    <img class="img-circle img-bordered-sm" src="<?php echo validate_image('admin/overtimeForm/profile_f.png') ?>">
                            <?php
                                    break;
                            }
                            ?>
                            <span class="username">
                                <?php echo $reqName ?>
                            </span>
                            <span class="description"><?php echo $reqPosition ?></span>
                            <span class="description"><?php echo $newDateformat ?></span>
                        </div>
                    </div>
                </div>
            </div>

            <HR>
            <div class="row">
                <div class="col-md-4">
                    <label class="control-label text-info">DEPARTMENT</label>
                    <div><?php echo isset($department) ? $department : '' ?></div>
                </div>
                <div class="col-md-4">
                    <label class="control-label text-info"> PRODUCT LINE</label>
                    <div><?php echo isset($productline) ? $productline : '' ?></div>
                </div>
                <div class="col-md-4">
                    <label class="control-label text-info">PAYROLL CUT-OFF PERIOD</label>
                    <?php

                    $date = new DateTime($date_from);
                    $date0 = new DateTime($date_to);

                    $newDateformat = $date->format('m-d-Y');
                    $newDateformat0 = $date0->format('m-d-Y');
                    ?>
                    <div><?php echo isset($ot_form_no) ? $newDateformat . " To " . $newDateformat0 : '' ?></div>
                </div>
            </div>
            <hr>
            <fieldset>
                <p class="text-center">The following employees have expressed their request and willingness to render overtime work on the date and time as specified below.</p>
                <!-- Table to display the added inputs -->
                <table class="table table-striped table-bordered" id="dataTable">
                    <colgroup>
                        <col width="10%">
                        <col width="23%">
                        <col width="8%">
                        <col width="13%">
                        <col width="14%">
                        <col width="32%">
                    </colgroup>
                    <thead>
                        <tr class="text-light bg-navy">
                            <th class="text-center py-1 px-2">EMP. NO.</th>
                            <th class="text-center py-1 px-2">EMP. NAME</th>
                            <th class="text-center py-1 px-2">WORK SHIFT</th>
                            <th class="text-center py-1 px-2">DATE REQUESTED</th>
                            <th class="text-center py-1 px-2">OT TIME</th>
                            <th class="text-center py-1 px-2">REASON</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $i = 1;
                        $qry = $conn->query("SELECT * FROM overtime_items WHERE ot_form_code = '{$ot_form_no}'");
                        while ($row = $qry->fetch_assoc()) :
                        ?>
                            <tr>
                                <td class="text-center"><?php echo $row['emp_num'] ?></td>
                                <td class="text-center"><?php echo $row['emp_name'] ?></td>
                                <td class="text-center"><?php echo $row['work_shift'] ?></td>

                                <?php
                                $date1 = new DateTime($row['ot_date_from']);
                                // $date2 = new DateTime($row['ot_date_to']);

                                $newDateformat1 = $date1->format('m-d-Y');
                                // $newDateformat2 = $date2->format('m-d-Y');
                                ?>

                                <td class="text-center"><?php echo $newDateformat1 ?></td>
                                <td class="text-center"><?php echo $row['ot_time_from'] . " To " . $row['ot_time_to'] ?></td>
                                <td class="text-center"><?php echo $row['ot_reason'] ?></td>
                            </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </fieldset>
            <HR>

            <div class="row">
                <div class="col-md-6">
                    <label class="control-label text-info"><?php echo $lblManager ?>&nbsp;<i>Department Manager</i></label>
                    <div class="mt-1">
                        <?php
                        if ($dh_status > 0) {
                            $qry = $conn->query("SELECT * FROM employee_masterlist WHERE EMPLOYID = '{$dh_name}'");
                            while ($row = $qry->fetch_assoc()) :
                                $reqName = $row['EMPNAME'];
                                $reqPosition = $row['JOB_TITLE'];
                                $reqDepartment = $row['DEPARTMENT'];
                                $reqGender = $row['EMPSEX'];
                            endwhile;
                            // $newDateformat = date("l, F j, Y H:m:s A", strtotime($dh_sign_date));
                            $dateCreated = new DateTime($dh_sign_date);
                            $newDateformat = $dateCreated->format('m-d-Y h:i:s a');
                        ?>
                            <div class="user-block">
                                <?php
                                switch ($reqGender) {
                                    case 1:
                                ?>
                                        <img class="img-circle img-bordered-sm" src="<?php echo validate_image('admin/overtimeForm/profile.png') ?>">
                                        <?php
                                        break;
                                        ?>
                                    <?php
                                    case 2:
                                    ?>
                                        <img class="img-circle img-bordered-sm" src="<?php echo validate_image('admin/overtimeForm/profile_f.png') ?>">
                                <?php
                                        break;
                                }
                                ?>

                                <span class="username">
                                    <?php echo $reqName ?>
                                </span>
                                <span class="description"><?php echo $reqPosition ?></span>
                                <span class="description"><?php echo $newDateformat ?></span>
                            </div>
                        <?php
                        }
                        ?>
                        <?php
                        if ($dh_status == 0) {
                        ?>
                            <span class="badge badge-primary rounded-pill">Pending</span>
                        <?php
                        }
                        ?>
                    </div>
                </div>
                <div class="col-md-6">
                    <?php
                    if ($dh_status !== 0) {
                    ?>
                        <label class="control-label text-info">REMARKS</label>
                        <p>
                            <?php echo $dh_remarks; ?>
                        </p>
                    <?php
                    }
                    ?>
                </div>
            </div>
            <hr>
            <div class="row mt-3">
                <div class="col-md-6">
                    <label class="control-label text-info"><?php echo $lblDirector ?>&nbsp;<i>Operations Director</i></label>
                    <div class="mt-1">
                        <?php
                        if ($od_status > 0) {
                            $qry = $conn->query("SELECT * FROM employee_masterlist WHERE EMPLOYID = '{$od_name}'");
                            while ($row = $qry->fetch_assoc()) :
                                $reqName = $row['EMPNAME'];
                                $reqPosition = $row['JOB_TITLE'];
                                $reqDepartment = $row['DEPARTMENT'];
                                $reqGender = $row['EMPSEX'];
                            endwhile;
                            // $newDateformat = date("l, F j, Y H:m:s A", strtotime($od_sign_date));
                            $dateCreated = new DateTime($od_sign_date);
                            $newDateformat = $dateCreated->format('m-d-Y h:i:s a');
                        ?>
                            <div class="user-block">
                                <?php
                                switch ($reqGender) {
                                    case 1:
                                ?>
                                        <img class="img-circle img-bordered-sm" src="<?php echo validate_image('admin/overtimeForm/profile.png') ?>">
                                        <?php
                                        break;
                                        ?>
                                    <?php
                                    case 2:
                                    ?>
                                        <img class="img-circle img-bordered-sm" src="<?php echo validate_image('admin/overtimeForm/profile_f.png') ?>">
                                <?php
                                        break;
                                }
                                ?>

                                <span class="username">
                                    <?php echo $reqName ?>
                                </span>
                                <span class="description"><?php echo $reqPosition ?></span>
                                <span class="description"><?php echo $newDateformat ?></span>
                            </div>
                        <?php
                        }
                        ?>
                        <?php
                        if ($od_status == 0) {
                        ?>
                            <span class="badge badge-primary rounded-pill">Pending</span>
                        <?php
                        }
                        ?>
                    </div>
                </div>
                <div class="col-md-6">
                    <?php
                    if ($od_status !== 0) {
                    ?>
                        <label class="control-label text-info">REMARKS</label>
                        <p>
                            <?php echo $od_remarks; ?>
                        </p>
                    <?php
                    }
                    ?>
                </div>
            </div>
        </div>
        <br>
        <hr>
        <div class="card-footer py-1 text-center">
            <br>
            <p class="text-center"><i class="fa fa-info-circle fa-lg text-primary" aria-hidden="true">&nbsp;&nbsp;</i>Work Shift Legend: <b><i>A</i></b> - Morning Shift (7:00AM - 7:00PM) &nbsp; <b><i>C</i></b> - Night Shift (7:00PM - 7:00AM) &nbsp; <b><i>N</i></b> - Normal Shift (7:00AM - 4:00PM)</p>

            <!-- <button class="btn btn-flat btn-success" type="button" id="print">Print</button> -->
            <?php
            if ($ot_status == 2) {
            ?>
                <a class="btn btn-flat btn-primary" href="<?php echo base_url . 'pdf_pr.php?&id=' . $ot_form_no ?>" target="_blank">PDF</a>
            <?php
            }
            ?>
            <!-- <a class="btn btn-flat btn-primary" href="<?php echo base_url . '/admin?page=purchase_order' ?>"><i class="fas fa-file-download"></i> PDF</a> -->
        </div>
    </div>


    <script>
        $(function() {
            $('#print').click(function() {
                start_loader()
                var _el = $('<div>')
                var _head = $('head').clone()
                _head.find('title').text("Overtime Request Details - Print View")
                var p = $('#print_out').clone()
                p.find('tr.text-light').removeClass("text-light bg-navy")
                _el.append(_head)
                _el.append('<div class="d-flex justify-content-center">' +
                    '<div class="col-1 text-right">' +
                    '<img src="<?php echo validate_image($_settings->info('logo')) ?>" width="65px" height="65px" />' +
                    '</div>' +
                    '<div class="col-10">' +
                    '<h4 class="text-center"><?php echo $_settings->info('name') ?></h4>' +
                    '<h4 class="text-center"></h4>' +
                    '</div>' +
                    '<div class="col-1 text-right">' +
                    '</div>' +
                    '</div><hr/>')
                _el.append(p.html())
                var nw = window.open("", "", "width=1200,height=900,left=250,location=no,titlebar=yes")
                nw.document.write(_el.html())
                nw.document.close()
                setTimeout(() => {
                    nw.print()
                    setTimeout(() => {
                        nw.close()
                        end_loader()
                    }, 200);
                }, 500);
            })
        })
    </script>